// ============================================================
// ChartQuiz — Logique du quiz Direction
// Dépend de : js/supabase.js (chargé avant dans quiz.html)
// ============================================================

// ── CONSTANTES ────────────────────────────────────────────────
// Centraliser les magic strings CSS évite les bugs de typo
const CSS = {
  SELECTED: { UP: 'selected-up', DOWN: 'selected-down', SIDEWAYS: 'selected-side' },
  CORRECT:  'correct',
  WRONG:    'wrong',
  DISABLED: 'disabled',
  VISIBLE:  'visible',
};

const SCROLL_DELAY_MS = 50;

// ── ÉTAT CENTRALISÉ ───────────────────────────────────────────
// Toutes les variables de session regroupées — reset propre via resetState()
const quizState = {
  currentQuestion:  null,   // { question, options, image }
  selected:         null,   // 'UP' | 'DOWN' | 'SIDEWAYS'
  submitted:        false,
  sessionId:        getOrCreateSessionId(),
  sessionQuestions: [],     // tableau de { question, options, image } — chargé en début de session
  sessionIndex:     0,      // index de la question courante (0-based)
  sessionResults:   [],     // { est_correcte, question, image } — accumulé au fil des réponses
  sessionSize:      10,     // nombre de questions par session
  userId:           null,   // auth.users.id — rempli à l'init si connecté
};

function resetState() {
  // currentQuestion conservé — écrasé uniquement par initQuiz() au chargement
  quizState.selected  = null;
  quizState.submitted = false;
}

// ── HELPER DOM ────────────────────────────────────────────────
// Évite les crashes silencieux si un ID est absent du HTML
function $(id) {
  const el = document.getElementById(id);
  if (!el) console.warn(`[ChartQuiz] Élément #${id} introuvable`);
  return el;
}

// ── INITIALISATION ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateThemeBtn();
  bindEventListeners();
  initSession();
});

// Remplace les onclick inline — un seul point d'entrée par interaction
function bindEventListeners() {
  // Sélection d'option (délégation sur le parent)
  $('options')?.addEventListener('click', e => {
    const opt = e.target.closest('.opt');
    if (opt && !quizState.submitted) selectOpt(opt, opt.dataset.direction);
  });

  // Bouton valider
  $('submit-btn')?.addEventListener('click', submitAnswer);

  // Compteur de caractères commentaire
  $('comment-input')?.addEventListener('input', updateCount);

  // Thème
  $('theme-btn')?.addEventListener('click', toggleTheme);

  // Logout
  $('logout-btn')?.addEventListener('click', handleLogout);

  // Sidebar
  $('sidebar-toggle')?.addEventListener('click', toggleSidebar);
  $('sidebar-close')?.addEventListener('click', closeSidebar);
  $('sidebar-overlay')?.addEventListener('click', closeSidebar);

  // Question suivante
  $('next-btn')?.addEventListener('click', loadNextQuestion);

  // Nouvelle session (écran de fin)
  $('restart-btn')?.addEventListener('click', restartSession);
}

async function initSession(n = quizState.sessionSize) {
  try {
    $('quiz-main')?.classList.add('hidden');
    showLoading(true);

    // Vérifier l'auth — rediriger vers auth.html si non connecté
    const user = await getCurrentUser();
    if (!user) {
      sessionStorage.setItem('chartquiz-auth-redirect', 'quiz.html');
      window.location.href = 'auth.html';
      return;
    }
    quizState.userId = user.id;
    // Créer le profil s'il n'existe pas (migration / signup interrompu)
    await ensureUserProfile(user.id, user.email, user.user_metadata?.pseudo).catch(() => null);
    const profile = await getUserProfile(user.id).catch(() => null);
    updateUserDisplay(user, profile);

    quizState.sessionId = resetSession();

    const qid = new URLSearchParams(window.location.search).get('qid');
    if (qid) {
      quizState.sessionQuestions = [await loadQuestionById(qid)];
    } else {
      quizState.sessionQuestions = await loadQuestionsForSession(n);
    }
    quizState.sessionIndex     = 0;
    quizState.sessionResults   = [];
    quizState.currentQuestion  = quizState.sessionQuestions[0];
    renderQuestion(quizState.currentQuestion);
  } catch (e) {
    console.error('[ChartQuiz] Erreur chargement session:', e);
    showError(`Erreur : ${e?.message || e}`);
  } finally {
    showLoading(false);
    $('quiz-main')?.classList.remove('hidden');
  }
}

// Affiche le pseudo (ou email tronqué) dans le header
function updateUserDisplay(user, profile = null) {
  const badge = $('user-badge');
  if (!badge) return;
  const pseudo = profile?.pseudo || user.user_metadata?.pseudo;
  const label  = pseudo || user.email?.split('@')[0] || 'Trader';
  badge.textContent = label.toUpperCase();
}

// ── RENDU ─────────────────────────────────────────────────────
function renderQuestion({ question, image }) {
  $('question-label').textContent = `Quiz #${question.id.replace('q-', '')}`;
  $('question-text').textContent  = question.titre;

  const imgAvant = $('chart-avant-img');
  imgAvant.src = image.url_avant;
  imgAvant.alt = `Graphique AVANT — ${question.id}`;

  resetQuizUI();
  updateProgress();
}

function resetQuizUI() {
  resetState();

  const submitBtn = $('submit-btn');
  submitBtn.disabled    = true;
  submitBtn.textContent = 'Valider ma réponse';

  const commentInput = $('comment-input');
  commentInput.value  = '';

  const charCount = $('char-count');
  charCount.textContent = '0 / 200';
  charCount.classList.remove('warn');

  $('result-section')?.classList.remove(CSS.VISIBLE);

  const nextBtn = $('next-btn');
  if (nextBtn) {
    nextBtn.style.display  = 'none';
    nextBtn.disabled       = false;
    nextBtn.textContent    = 'Question suivante →';
  }

  // Retirer toutes les classes d'état sur les options
  document.querySelectorAll('.opt').forEach(btn =>
    btn.classList.remove(...Object.values(CSS.SELECTED), CSS.CORRECT, CSS.WRONG, CSS.DISABLED)
  );
}

// ── PROGRESSION ───────────────────────────────────────────────
function updateProgress() {
  const total   = quizState.sessionQuestions.length;
  const current = quizState.sessionIndex + 1;
  const circumference = 106.8; // 2 * Math.PI * 17
  const filled  = (current / total) * circumference;
  const pieFill = $('pie-fill');
  if (pieFill) pieFill.setAttribute('stroke-dasharray', `${filled.toFixed(1)} ${circumference}`);
  const pieText = $('pie-text');
  if (pieText) pieText.textContent = `${current}/${total}`;
}

// ── SÉLECTION D'UNE OPTION ────────────────────────────────────
function selectOpt(el, dir) {
  if (quizState.submitted || !dir) return;

  quizState.selected = dir;

  // Retirer la sélection précédente
  document.querySelectorAll('.opt').forEach(btn =>
    btn.classList.remove(...Object.values(CSS.SELECTED))
  );

  // Appliquer la nouvelle sélection
  el.classList.add(CSS.SELECTED[dir]);
  $('submit-btn').disabled = false;
}

// ── COMPTEUR DE CARACTÈRES ────────────────────────────────────
function updateCount() {
  const len     = $('comment-input').value.length;
  const counter = $('char-count');
  counter.textContent = `${len} / 200`;
  counter.classList.toggle('warn', len >= 180);
}

// ── VALIDATION — orchestration des 4 étapes ──────────────────
async function submitAnswer() {
  if (!quizState.selected || quizState.submitted) return;
  quizState.submitted = true;

  try {
    const { currentQuestion, selected, sessionId } = quizState;
    const correctOpt  = currentQuestion.options.find(o => o.est_correcte);
    const correct     = correctOpt?.texte;
    const est_correcte = selected === correct;
    const commentaire  = $('comment-input').value;

    // Étape 1 — désactiver l'interface
    disableOptions();

    // Étape 2 — colorer les boutons
    colorizeOptions(correct, selected, est_correcte);

    // Étape 3 — sauvegarder (non bloquant)
    saveResponse({
      question_id:  currentQuestion.question.id,
      session_id:   sessionId,
      direction:    selected,
      est_correcte,
      commentaire,
      user_id:      quizState.userId,
    }).catch(e => {
      console.warn('[ChartQuiz] Sauvegarde non critique:', e.message);
      showSaveWarning();
    });

    // Étape 4 — révéler le résultat
    revealResult(est_correcte, correct, currentQuestion);

  } catch (e) {
    console.error('[ChartQuiz] Erreur submitAnswer:', e);
    showError(`Erreur validation : ${e?.message || e}`);
    quizState.submitted = false;
  }
}

// ── ÉTAPES DE SOUMISSION ──────────────────────────────────────
function disableOptions() {
  document.querySelectorAll('.opt').forEach(btn => btn.classList.add(CSS.DISABLED));
  const btn = $('submit-btn');
  btn.disabled    = true;
  btn.textContent = 'Réponse enregistrée';
}

function colorizeOptions(correct, selected, est_correcte) {
  document.querySelectorAll('.opt').forEach(btn => {
    const dir = btn.querySelector('.opt-name')?.textContent;
    if (dir === correct)                       btn.classList.add(CSS.CORRECT);
    else if (dir === selected && !est_correcte) btn.classList.add(CSS.WRONG);
  });
}

function revealResult(est_correcte, correct, { question, image }) {
  $('result-banner').className = `result-banner ${est_correcte ? 'correct-banner' : 'wrong-banner'}`;
  $('result-icon').textContent  = est_correcte ? '✓' : '✗';
  $('result-title').textContent = est_correcte ? 'Bonne analyse !' : 'Pas tout à fait…';
  $('result-sub').textContent   = est_correcte
    ? `La direction correcte était bien ${correct}`
    : `La direction correcte était ${correct}`;

  const imgApres = $('chart-apres-img');
  imgApres.src = image.url_apres;
  imgApres.alt = `Graphique APRÈS — ${question.id}`;

  const imgExpl = $('chart-expl-img');
  imgExpl.src = image.url_explication;
  imgExpl.alt = `Graphique EXPLICATION — ${question.id}`;

  const explList = $('expl-list');
  if (explList) {
    const lines = (question.explication_texte ?? '').split('\n').filter(l => l.trim());
    explList.innerHTML = lines.map(line => {
      const m = line.match(/^(\d+)\.\s*(.*)/);
      if (m) return `<li><span class="expl-num">${m[1]}.</span><span>${m[2]}</span></li>`;
      return `<li><span class="expl-num">→</span><span>${line}</span></li>`;
    }).join('');
  }

  // Enregistrer le résultat pour l'écran de fin de session
  quizState.sessionResults.push({ est_correcte, question, image });

  const section = $('result-section');
  section.classList.add(CSS.VISIBLE);

  const nextBtn = $('next-btn');
  if (nextBtn) {
    const isLast = quizState.sessionIndex === quizState.sessionQuestions.length - 1;
    nextBtn.textContent   = isLast ? 'Voir les résultats →' : 'Question suivante →';
    nextBtn.style.display = 'block';
  }

  setTimeout(() => section.scrollIntoView({ behavior: 'smooth', block: 'start' }), SCROLL_DELAY_MS);
}

// ── QUESTION SUIVANTE ─────────────────────────────────────────
function loadNextQuestion() {
  const nextIndex = quizState.sessionIndex + 1;
  if (nextIndex >= quizState.sessionQuestions.length) {
    showSessionEnd();
    return;
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
  quizState.sessionIndex    = nextIndex;
  quizState.currentQuestion = quizState.sessionQuestions[nextIndex];
  renderQuestion(quizState.currentQuestion);
}

// ── FIN DE SESSION ────────────────────────────────────────────
function showSessionEnd() {
  const results = quizState.sessionResults;
  const correct = results.filter(r => r.est_correcte).length;
  const total   = results.length;

  $('score-num').textContent = `${correct} / ${total}`;
  $('score-sub').textContent = correct === total
    ? 'Parfait !'
    : correct >= total / 2
    ? 'Bon travail !'
    : "Continue à t'entraîner !";

  const sourcesList = $('sources-list');
  if (sourcesList) {
    sourcesList.innerHTML = results.map((r, i) => `
      <div class="source-row ${r.est_correcte ? 'correct' : 'wrong'}">
        <span class="source-row-num">${i + 1}</span>
        <span class="source-row-icon">${r.est_correcte ? '✓' : '✗'}</span>
        <span class="source-row-info">${r.image.source_info ?? '—'}</span>
      </div>
    `).join('');
  }

  $('quiz-main')?.classList.add('hidden');
  $('session-end')?.classList.add('visible');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function restartSession() {
  $('session-end')?.classList.remove('visible');
  await initSession();
}

// ── AUTH ──────────────────────────────────────────────────────
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

// Avertissement discret si la sauvegarde échoue (non bloquant)
function showSaveWarning() {
  const el = $('save-warning');
  if (el) el.style.display = 'block';
}
