// ============================================================
// ChartQuiz — Logique What Do You Do
// Dépend de : js/supabase.js (chargé avant dans what-do-you-do.html)
// ============================================================

// ── CONSTANTES ────────────────────────────────────────────────
const WTD_CSS = {
  SELECTED: 'selected-wtd',
  CORRECT:  'correct',
  WRONG:    'wrong',
  DISABLED: 'disabled',
  VISIBLE:  'visible',
};

const WTD_LABELS  = ['A', 'B', 'C'];
const SCROLL_DELAY = 50;

// ── ÉTAT ──────────────────────────────────────────────────────
const wtdState = {
  currentQuestion:  null,   // { question, options (shuffled), image }
  selectedOptionId: null,
  submitted:        false,
  sessionId:        getOrCreateSessionId(),
  sessionQuestions: [],
  sessionIndex:     0,
  sessionResults:   [],
  sessionSize:      5,
  userId:           null,
};

function wtdResetState() {
  wtdState.selectedOptionId = null;
  wtdState.submitted        = false;
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
  initWTDSession();
});

function bindEventListeners() {
  $('wtd-options')?.addEventListener('click', e => {
    const opt = e.target.closest('.opt-wtd');
    if (opt && !wtdState.submitted) wtdSelectOpt(opt, opt.dataset.optionId);
  });
  $('submit-btn')?.addEventListener('click', wtdSubmitAnswer);
  $('next-btn')?.addEventListener('click', wtdLoadNextQuestion);
  $('restart-btn')?.addEventListener('click', wtdRestartSession);
  $('theme-btn')?.addEventListener('click', toggleTheme);
  $('logout-btn')?.addEventListener('click', handleLogout);
  $('sidebar-toggle')?.addEventListener('click', toggleSidebar);
  $('sidebar-close')?.addEventListener('click', closeSidebar);
  $('sidebar-overlay')?.addEventListener('click', closeSidebar);
}

async function initWTDSession() {
  try {
    $('wtd-main')?.classList.add('hidden');
    showLoading(true);

    const user = await getCurrentUser();
    if (!user) {
      sessionStorage.setItem('chartquiz-auth-redirect', 'what-do-you-do.html');
      window.location.href = 'auth.html';
      return;
    }
    wtdState.userId = user.id;
    await ensureUserProfile(user.id, user.email, user.user_metadata?.pseudo).catch(() => null);
    const profile = await getUserProfile(user.id).catch(() => null);
    updateUserDisplay(user, profile);

    wtdState.sessionId = resetSession();
    const qid = new URLSearchParams(window.location.search).get('qid');
    if (qid) {
      wtdState.sessionQuestions = [await loadWTDQuestionById(qid)];
    } else {
      wtdState.sessionQuestions = await loadWTDQuestionsForSession(wtdState.sessionSize);
    }
    wtdState.sessionIndex     = 0;
    wtdState.sessionResults   = [];
    wtdState.currentQuestion  = wtdState.sessionQuestions[0];
    wtdRenderQuestion(wtdState.currentQuestion);
  } catch (e) {
    console.error('[ChartQuiz] Erreur WTD session:', e);
    showError(`Erreur : ${e?.message || e}`);
  } finally {
    showLoading(false);
    $('wtd-main')?.classList.remove('hidden');
  }
}

// ── RENDU ─────────────────────────────────────────────────────
function wtdRenderQuestion({ question, options, image }) {
  $('wtd-question-label').textContent = `Situation #${question.id.replace('wtd-', '')}`;
  $('wtd-question-text').textContent  = question.titre;
  $('chart-avant').src = image.url_avant;

  // Mélanger les options pour ne pas toujours avoir la bonne en position 3
  const shuffled = [...options].sort(() => Math.random() - 0.5);

  const container = $('wtd-options');
  container.innerHTML = shuffled.map((opt, i) => `
    <div class="opt opt-wtd" data-option-id="${opt.id}">
      <span class="wtd-opt-num">${WTD_LABELS[i]}</span>
      <span class="wtd-opt-text">${opt.texte}</span>
    </div>
  `).join('');

  // Stocker les options mélangées dans l'état courant pour la colorisation
  wtdState.currentQuestion = { question, options: shuffled, image };

  wtdResetUI();
  wtdUpdateProgress();
}

function wtdResetUI() {
  wtdResetState();

  const submitBtn = $('submit-btn');
  submitBtn.disabled    = true;
  submitBtn.textContent = 'Valider ma réponse';

  $('wtd-result-section')?.classList.remove(WTD_CSS.VISIBLE);

  const nextBtn = $('next-btn');
  if (nextBtn) {
    nextBtn.style.display = 'none';
    nextBtn.disabled      = false;
    nextBtn.textContent   = 'Situation suivante →';
  }
}

function wtdUpdateProgress() {
  const total   = wtdState.sessionQuestions.length;
  const current = wtdState.sessionIndex + 1;
  const circumference = 106.8;
  const filled  = (current / total) * circumference;
  const pieFill = $('pie-fill');
  if (pieFill) pieFill.setAttribute('stroke-dasharray', `${filled.toFixed(1)} ${circumference}`);
  const pieText = $('pie-text');
  if (pieText) pieText.textContent = `${current}/${total}`;
}

// ── SÉLECTION ─────────────────────────────────────────────────
function wtdSelectOpt(el, optionId) {
  if (wtdState.submitted || !optionId) return;
  wtdState.selectedOptionId = optionId;

  document.querySelectorAll('.opt-wtd').forEach(btn =>
    btn.classList.remove(WTD_CSS.SELECTED)
  );
  el.classList.add(WTD_CSS.SELECTED);
  $('submit-btn').disabled = false;
}

// ── VALIDATION ────────────────────────────────────────────────
async function wtdSubmitAnswer() {
  if (!wtdState.selectedOptionId || wtdState.submitted) return;
  wtdState.submitted = true;

  try {
    const { currentQuestion, selectedOptionId, sessionId } = wtdState;
    const correctOption = currentQuestion.options.find(o => o.est_correcte);
    const est_correcte  = selectedOptionId === correctOption?.id;

    wtdDisableOptions();
    wtdColorizeOptions(correctOption?.id, selectedOptionId, est_correcte);

    saveWTDResponse({
      question_id:  currentQuestion.question.id,
      session_id:   sessionId,
      option_id:    selectedOptionId,
      est_correcte,
      user_id:      wtdState.userId,
    }).catch(e => console.warn('[ChartQuiz] WTD save non critique:', e.message));

    wtdRevealResult(est_correcte, correctOption, currentQuestion);
  } catch (e) {
    console.error('[ChartQuiz] Erreur WTD submit:', e);
    showError(`Erreur : ${e?.message || e}`);
    wtdState.submitted = false;
  }
}

function wtdDisableOptions() {
  document.querySelectorAll('.opt-wtd').forEach(btn => btn.classList.add(WTD_CSS.DISABLED));
  const btn = $('submit-btn');
  btn.disabled    = true;
  btn.textContent = 'Réponse enregistrée';
}

function wtdColorizeOptions(correctId, selectedId, est_correcte) {
  document.querySelectorAll('.opt-wtd').forEach(btn => {
    const id = btn.dataset.optionId;
    if (id === correctId)                      btn.classList.add(WTD_CSS.CORRECT);
    else if (id === selectedId && !est_correcte) btn.classList.add(WTD_CSS.WRONG);
  });
}

function wtdRevealResult(est_correcte, correctOption, { question, image }) {
  $('wtd-result-banner').className = `result-banner ${est_correcte ? 'correct-banner' : 'wrong-banner'}`;
  $('wtd-result-icon').textContent  = est_correcte ? '✓' : '✗';
  $('wtd-result-title').textContent = est_correcte ? 'Bonne lecture !' : 'Pas tout à fait…';
  $('wtd-result-sub').textContent   = est_correcte
    ? 'Tu as bien identifié la bonne action à mener.'
    : `La bonne réponse était : « ${correctOption?.texte ?? ''} »`;

  $('chart-apres').src = image.url_apres;
  $('chart-expl').src  = image.url_explication;

  const explList = $('wtd-expl-list');
  if (explList) {
    const lines = (question.explication_texte ?? '').split('\n').filter(l => l.trim());
    explList.innerHTML = lines.map(line => {
      const m = line.match(/^(\d+)\.\s*(.*)/);
      if (m) return `<li><span class="expl-num">${m[1]}.</span><span>${m[2]}</span></li>`;
      return `<li><span class="expl-num">→</span><span>${line}</span></li>`;
    }).join('');
  }

  wtdState.sessionResults.push({ est_correcte, question, image });

  const section = $('wtd-result-section');
  section.classList.add(WTD_CSS.VISIBLE);

  const nextBtn = $('next-btn');
  if (nextBtn) {
    const isLast = wtdState.sessionIndex === wtdState.sessionQuestions.length - 1;
    nextBtn.textContent   = isLast ? 'Voir les résultats →' : 'Situation suivante →';
    nextBtn.style.display = 'block';
  }

  setTimeout(() => section.scrollIntoView({ behavior: 'smooth', block: 'start' }), SCROLL_DELAY);
}

// ── NAVIGATION ────────────────────────────────────────────────
function wtdLoadNextQuestion() {
  const nextIndex = wtdState.sessionIndex + 1;
  if (nextIndex >= wtdState.sessionQuestions.length) {
    wtdShowSessionEnd();
    return;
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
  wtdState.sessionIndex    = nextIndex;
  wtdState.currentQuestion = wtdState.sessionQuestions[nextIndex];
  wtdRenderQuestion(wtdState.currentQuestion);
}

// ── FIN DE SESSION ────────────────────────────────────────────
function wtdShowSessionEnd() {
  const results = wtdState.sessionResults;
  const correct = results.filter(r => r.est_correcte).length;
  const total   = results.length;

  $('wtd-score-num').textContent = `${correct} / ${total}`;
  $('wtd-score-sub').textContent = correct === total
    ? 'Parfait !'
    : correct >= total / 2
    ? 'Bon travail !'
    : "Continue à t'entraîner !";

  $('wtd-main')?.classList.add('hidden');
  $('wtd-session-end')?.classList.add('visible');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function wtdRestartSession() {
  $('wtd-session-end')?.classList.remove('visible');
  await initWTDSession();
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
