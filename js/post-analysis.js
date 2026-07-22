// ============================================================
// ChartQuiz — Logique Post Analysis
// Dépend de : js/supabase.js (chargé avant dans post-analysis.html)
// ============================================================

// ── CONSTANTES ────────────────────────────────────────────────
const PA_CSS = {
  SELECTED: { RIGHT: 'selected-right', WRONG: 'selected-wrong' },
  CORRECT:  'correct',
  WRONG_ANS:'wrong',
  DISABLED: 'disabled',
  VISIBLE:  'visible',
};

const PA_SCROLL_DELAY = 50;

const PA_COMPARE_LABELS = {
  setup:     'Type de setup',
  context:   'Context',
  edge:      'Edge',
  signal:    'Signal',
  execution: 'Exécution',
};

// ── ÉTAT ──────────────────────────────────────────────────────
const paState = {
  currentQuestion:  null,
  selected:         null,
  submitted:        false,
  sessionId:        getOrCreateSessionId(),
  sessionQuestions: [],
  sessionIndex:     0,
  sessionResults:   [],
  sessionSize:      10,
  userId:           null,
  analysisActive:   false,
  analysis: { setup: '', context: '', edge: '', signal: '', execution: '' },
};

function paResetState() {
  paState.selected      = null;
  paState.submitted     = false;
  paState.analysisActive = false;
  paState.analysis      = { setup: '', context: '', edge: '', signal: '', execution: '' };
}

// ── HELPER DOM ────────────────────────────────────────────────
function $(id) {
  const el = document.getElementById(id);
  if (!el) console.warn(`[ChartQuiz] Élément #${id} introuvable`);
  return el;
}

// ── INITIALISATION ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateThemeBtn();
  bindEventListeners();
  initPASession();
});

function bindEventListeners() {
  $('pa-options')?.addEventListener('click', e => {
    const opt = e.target.closest('.opt');
    if (opt && !paState.submitted) paSelectOpt(opt, opt.dataset.choix);
  });
  $('submit-btn')?.addEventListener('click', paSubmitAnswer);
  $('theme-btn')?.addEventListener('click', toggleTheme);
  $('logout-btn')?.addEventListener('click', handleLogout);
  $('sidebar-toggle')?.addEventListener('click', toggleSidebar);
  $('sidebar-close')?.addEventListener('click', closeSidebar);
  $('sidebar-overlay')?.addEventListener('click', closeSidebar);
  $('next-btn')?.addEventListener('click', paLoadNextQuestion);
  $('restart-btn')?.addEventListener('click', paRestartSession);
  bindAnalysisInputs();
}

function bindAnalysisInputs() {
  const textareas = [
    { id: 'pa-context',  counterId: 'pa-context-counter',  max: 300, key: 'context' },
    { id: 'pa-edge',     counterId: 'pa-edge-counter',      max: 200, key: 'edge' },
    { id: 'pa-signal',   counterId: 'pa-signal-counter',    max: 200, key: 'signal' },
  ];

  textareas.forEach(({ id, counterId, max, key }) => {
    const el = $(id);
    const counter = $(counterId);
    if (!el) return;
    el.addEventListener('input', () => {
      const len = el.value.length;
      paState.analysis[key] = el.value;
      if (counter) {
        counter.textContent = `${len} / ${max}`;
        counter.classList.toggle('over-limit', len >= Math.floor(max * 0.9));
      }
      updateSubmitGate();
    });
  });

  const setupEl = $('pa-setup');
  const execEl  = $('pa-execution');
  if (setupEl) setupEl.addEventListener('change', () => {
    paState.analysis.setup = setupEl.value;
    updateSubmitGate();
  });
  if (execEl) execEl.addEventListener('change', () => {
    paState.analysis.execution = execEl.value;
    updateSubmitGate();
  });
}

async function initPASession() {
  try {
    $('pa-main')?.classList.add('hidden');
    showLoading(true);

    const user = await getCurrentUser();
    if (!user) {
      sessionStorage.setItem('chartquiz-auth-redirect', 'post-analysis.html');
      window.location.href = 'auth.html';
      return;
    }
    paState.userId = user.id;
    await ensureUserProfile(user.id, user.email, user.user_metadata?.pseudo).catch(() => null);
    const profile = await getUserProfile(user.id).catch(() => null);
    updateUserDisplay(user, profile);

    paState.sessionId = resetSession();
    const qid = new URLSearchParams(window.location.search).get('qid');
    if (qid) {
      paState.sessionQuestions = [await loadPAQuestionById(qid)];
    } else {
      paState.sessionQuestions = await loadPAQuestionsForSession(paState.sessionSize);
    }
    paState.sessionIndex     = 0;
    paState.sessionResults   = [];
    paState.currentQuestion  = paState.sessionQuestions[0];
    paRenderQuestion(paState.currentQuestion);
  } catch (e) {
    console.error('[ChartQuiz] Erreur PA session:', e);
    showError(`Erreur : ${e?.message || e}`);
  } finally {
    showLoading(false);
    $('pa-main')?.classList.remove('hidden');
  }
}

// ── RENDU ─────────────────────────────────────────────────────
function paRenderQuestion({ question, image }) {
  $('pa-question-label').textContent = `Trade #${question.id.replace('pa-', '')}`;
  $('pa-question-text').textContent  = question.titre;

  $('chart-avant-1').src = image.url_avant_1;
  $('chart-avant-2').src = image.url_avant_2;

  paResetUI();
  paUpdateProgress();
}

function paResetUI() {
  paResetState();

  const q = paState.sessionQuestions[paState.sessionIndex]?.question;
  const hasAnalysis = q?.correct_setup != null;
  paState.analysisActive = hasAnalysis;

  // Form analyse
  const form = $('pa-analysis-form');
  if (form) form.hidden = !hasAnalysis;

  // Reset champs
  ['pa-setup', 'pa-execution'].forEach(id => {
    const el = $(id);
    if (el) { el.value = ''; el.disabled = false; }
  });
  ['pa-context', 'pa-edge', 'pa-signal'].forEach(id => {
    const el = $(id);
    if (el) { el.value = ''; el.disabled = false; }
  });
  [
    { id: 'pa-context-counter', max: 300 },
    { id: 'pa-edge-counter',    max: 200 },
    { id: 'pa-signal-counter',  max: 200 },
  ].forEach(({ id, max }) => {
    const el = $(id);
    if (el) { el.textContent = `0 / ${max}`; el.classList.remove('over-limit'); }
  });

  // Compare section
  const compare = $('pa-analysis-compare');
  if (compare) compare.hidden = true;
  const grid = $('pa-compare-grid');
  if (grid) grid.innerHTML = '';

  // Submit btn
  const submitBtn = $('submit-btn');
  submitBtn.disabled    = true;
  submitBtn.textContent = 'Valider ma réponse';

  $('pa-result-section')?.classList.remove(PA_CSS.VISIBLE);

  const nextBtn = $('next-btn');
  if (nextBtn) {
    nextBtn.style.display = 'none';
    nextBtn.disabled      = false;
    nextBtn.textContent   = 'Trade suivant →';
  }

  document.querySelectorAll('.opt').forEach(btn =>
    btn.classList.remove(
      ...Object.values(PA_CSS.SELECTED),
      PA_CSS.CORRECT,
      PA_CSS.WRONG_ANS,
      PA_CSS.DISABLED
    )
  );
}

function paUpdateProgress() {
  const total   = paState.sessionQuestions.length;
  const current = paState.sessionIndex + 1;
  const circumference = 106.8;
  const filled  = (current / total) * circumference;
  const pieFill = $('pie-fill');
  if (pieFill) pieFill.setAttribute('stroke-dasharray', `${filled.toFixed(1)} ${circumference}`);
  const pieText = $('pie-text');
  if (pieText) pieText.textContent = `${current}/${total}`;
}

// ── SÉLECTION ─────────────────────────────────────────────────
function paSelectOpt(el, choix) {
  if (paState.submitted || !choix) return;
  paState.selected = choix;

  document.querySelectorAll('.opt').forEach(btn =>
    btn.classList.remove(...Object.values(PA_CSS.SELECTED))
  );
  el.classList.add(PA_CSS.SELECTED[choix]);
  updateSubmitGate();
}

// ── GATE SUBMIT ───────────────────────────────────────────────
function updateSubmitGate() {
  if (paState.submitted) return;
  const btn = $('submit-btn');
  if (!btn) return;

  const hasChoice = !!paState.selected;

  if (!paState.analysisActive) {
    btn.disabled = !hasChoice;
    return;
  }

  const { setup, context, edge, signal, execution } = paState.analysis;
  const allFilled = setup && context.trim() && edge.trim() && signal.trim() && execution;
  btn.disabled = !(hasChoice && allFilled);
}

// ── VALIDATION ────────────────────────────────────────────────
async function paSubmitAnswer() {
  if (!paState.selected || paState.submitted) return;
  paState.submitted = true;

  try {
    const { currentQuestion, selected, sessionId } = paState;
    const correct      = currentQuestion.question.bonne_reponse;
    const est_correcte = selected === correct;

    paDisableOptions();
    paColorizeOptions(correct, selected, est_correcte);
    paDisableAnalysisForm();

    savePAResponse({
      question_id:  currentQuestion.question.id,
      session_id:   sessionId,
      choix:        selected,
      est_correcte,
      user_id:      paState.userId,
    }).catch(e => console.warn('[ChartQuiz] PA save non critique:', e.message));

    paRevealResult(est_correcte, correct, currentQuestion);
  } catch (e) {
    console.error('[ChartQuiz] Erreur PA submit:', e);
    showError(`Erreur : ${e?.message || e}`);
    paState.submitted = false;
  }
}

function paDisableOptions() {
  document.querySelectorAll('.opt').forEach(btn => btn.classList.add(PA_CSS.DISABLED));
  const btn = $('submit-btn');
  btn.disabled    = true;
  btn.textContent = 'Réponse enregistrée';
}

function paDisableAnalysisForm() {
  if (!paState.analysisActive) return;
  ['pa-setup', 'pa-execution', 'pa-context', 'pa-edge', 'pa-signal'].forEach(id => {
    const el = $(id);
    if (el) el.disabled = true;
  });
}

function paColorizeOptions(correct, selected, est_correcte) {
  document.querySelectorAll('.opt').forEach(btn => {
    const choix = btn.dataset.choix;
    if (choix === correct)                        btn.classList.add(PA_CSS.CORRECT);
    else if (choix === selected && !est_correcte) btn.classList.add(PA_CSS.WRONG_ANS);
  });
}

function paRevealResult(est_correcte, correct, { question, image }) {
  $('pa-result-banner').className = `result-banner ${est_correcte ? 'correct-banner' : 'wrong-banner'}`;
  $('pa-result-icon').textContent  = est_correcte ? '✓' : '✗';
  $('pa-result-title').textContent = est_correcte ? 'Bonne analyse !' : 'Pas tout à fait…';
  $('pa-result-sub').textContent   = est_correcte
    ? `C'était bien un trade ${correct}`
    : `C'était un trade ${correct}`;

  if (paState.analysisActive) paBuildCompare(question);

  $('chart-apres-1').src = image.url_apres_1;
  $('chart-apres-2').src = image.url_apres_2;

  const explList = $('pa-expl-list');
  if (explList) {
    const lines = (question.explication_texte ?? '').split('\n').filter(l => l.trim());
    explList.innerHTML = lines.map(line => {
      const m = line.match(/^(\d+)\.\s*(.*)/);
      if (m) return `<li><span class="expl-num">${m[1]}.</span><span>${m[2]}</span></li>`;
      return `<li><span class="expl-num">→</span><span>${line}</span></li>`;
    }).join('');
  }

  paState.sessionResults.push({ est_correcte, question, image });

  const section = $('pa-result-section');
  section.classList.add(PA_CSS.VISIBLE);

  const nextBtn = $('next-btn');
  if (nextBtn) {
    const isLast = paState.sessionIndex === paState.sessionQuestions.length - 1;
    nextBtn.textContent   = isLast ? 'Voir les résultats →' : 'Trade suivant →';
    nextBtn.style.display = 'block';
  }

  setTimeout(() => section.scrollIntoView({ behavior: 'smooth', block: 'start' }), PA_SCROLL_DELAY);
}

// ── COMPARE ANALYSE ───────────────────────────────────────────
function paBuildCompare(question) {
  const compare = $('pa-analysis-compare');
  const grid    = $('pa-compare-grid');
  if (!compare || !grid) return;

  const fields = [
    { key: 'setup',     correct: question.correct_setup,     user: paState.analysis.setup,     graded: true },
    { key: 'context',   correct: question.correct_context,   user: paState.analysis.context,   graded: false },
    { key: 'edge',      correct: question.correct_edge,      user: paState.analysis.edge,       graded: false },
    { key: 'signal',    correct: question.correct_signal,    user: paState.analysis.signal,     graded: false },
    { key: 'execution', correct: question.correct_execution, user: paState.analysis.execution,  graded: true },
  ];

  grid.innerHTML = fields.map(({ key, correct, user, graded }) => {
    const isMatch    = graded && correct && user && correct.trim() === user.trim();
    const isMiss     = graded && correct && user && correct.trim() !== user.trim();
    const correctCls = graded ? (isMatch ? 'match' : '') : '';
    const userCls    = graded ? (isMatch ? 'match' : isMiss ? 'miss' : '') : '';
    const emptyClass = (v) => v?.trim() ? '' : ' empty';

    return `
      <div class="pa-compare-row">
        <div class="pa-compare-label">${PA_COMPARE_LABELS[key]}</div>
        <div class="pa-compare-cells">
          <div class="pa-compare-cell${correctCls ? ' ' + correctCls : ''}${emptyClass(correct)}"
               data-side="Référence">${escapeHtml(correct ?? '—')}</div>
          <div class="pa-compare-cell${userCls ? ' ' + userCls : ''}${emptyClass(user)}"
               data-side="Ton analyse">${escapeHtml(user ?? '—')}</div>
        </div>
      </div>`;
  }).join('');

  compare.hidden = false;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── NAVIGATION ────────────────────────────────────────────────
function paLoadNextQuestion() {
  const nextIndex = paState.sessionIndex + 1;
  if (nextIndex >= paState.sessionQuestions.length) {
    paShowSessionEnd();
    return;
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
  paState.sessionIndex    = nextIndex;
  paState.currentQuestion = paState.sessionQuestions[nextIndex];
  paRenderQuestion(paState.currentQuestion);
}

// ── FIN DE SESSION ────────────────────────────────────────────
function paShowSessionEnd() {
  const results = paState.sessionResults;
  const correct = results.filter(r => r.est_correcte).length;
  const total   = results.length;

  $('pa-score-num').textContent = `${correct} / ${total}`;
  $('pa-score-sub').textContent = correct === total
    ? 'Parfait !'
    : correct >= total / 2
    ? 'Bon travail !'
    : "Continue à t'entraîner !";

  $('pa-main')?.classList.add('hidden');
  $('pa-session-end')?.classList.add('visible');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function paRestartSession() {
  $('pa-session-end')?.classList.remove('visible');
  const currentQid = new URLSearchParams(window.location.search).get('qid');
  if (currentQid) {
    try {
      const responses = await loadPAUserResponses(paState.userId);
      const perQuestion = {};
      for (const r of responses) {
        const key = r.question_id;
        if (!perQuestion[key]) perQuestion[key] = { question_id: key, correct: 0, wrong: 0, total: 0 };
        perQuestion[key].total++;
        if (r.est_correcte) perQuestion[key].correct++;
        else perQuestion[key].wrong++;
      }
      const toRedo = Object.values(perQuestion)
        .filter(q => q.wrong >= 1 && (q.correct / q.total) * 100 <= 80 && q.question_id !== currentQid)
        .map(q => q.question_id);
      if (toRedo.length > 0) {
        const randomQid = toRedo[Math.floor(Math.random() * toRedo.length)];
        window.location.href = `post-analysis.html?qid=${encodeURIComponent(randomQid)}`;
        return;
      }
      window.history.replaceState({}, '', 'post-analysis.html');
    } catch (e) {
      console.error('[ChartQuiz] Erreur retake random PA:', e);
    }
  }
  await initPASession();
}

// ── AUTH / UI ─────────────────────────────────────────────────
function updateUserDisplay(user, profile) {
  const badge = $('user-badge');
  if (!badge) return;
  const pseudo = profile?.pseudo || user.user_metadata?.pseudo;
  badge.textContent = (pseudo || user.email?.split('@')[0] || 'Trader').toUpperCase();
}

async function handleLogout() {
  try {
    await signOut();
    window.location.href = 'auth.html';
  } catch (e) {
    console.error('[ChartQuiz] Erreur déconnexion:', e);
  }
}

// ── THÈME ─────────────────────────────────────────────────────
function updateThemeBtn() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const btn    = $('theme-btn');
  if (btn) btn.textContent = isDark ? '☀' : '☽';
  const m = document.querySelector('meta[name="theme-color"]');
  if (m) m.content = isDark ? '#0a0a0f' : '#ffffff';
}

function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
  localStorage.setItem('chartquiz-theme', isDark ? 'light' : 'dark');
  updateThemeBtn();
}

// ── SIDEBAR ───────────────────────────────────────────────────
function toggleSidebar() {
  const isOpen = $('sidebar')?.classList.toggle('open');
  $('sidebar-overlay')?.classList.toggle('visible', isOpen);
}

function closeSidebar() {
  $('sidebar')?.classList.remove('open');
  $('sidebar-overlay')?.classList.remove('visible');
}

// ── UTILITAIRES ───────────────────────────────────────────────
function showLoading(visible) {
  const el = $('loading-state');
  if (el) el.style.display = visible ? 'block' : 'none';
}

function showError(msg) {
  const el = $('error-state');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}
