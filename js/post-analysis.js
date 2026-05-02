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
};

function paResetState() {
  paState.selected  = null;
  paState.submitted = false;
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

    paState.sessionId        = resetSession();
    paState.sessionQuestions = await loadPAQuestionsForSession(paState.sessionSize);
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
  $('submit-btn').disabled = false;
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
