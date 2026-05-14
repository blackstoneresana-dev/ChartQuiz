// ============================================================
// ChartQuiz — Logique de la page d'authentification
// Dépend de : js/supabase.js (chargé avant dans auth.html)
// ============================================================

const AUTH_REDIRECT_KEY = 'chartquiz-auth-redirect';

// ── HELPER DOM ────────────────────────────────────────────────
function $(id) {
  const el = document.getElementById(id);
  if (!el) console.warn(`[ChartQuiz] Élément #${id} introuvable`);
  return el;
}

// ── INITIALISATION ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  updateThemeBtn();
  bindAuthListeners();

  // Si déjà connecté → rediriger directement
  const user = await getCurrentUser();
  if (user) {
    redirectAfterAuth();
    return;
  }

  // Lire le tab depuis l'URL (?mode=signup)
  const params = new URLSearchParams(window.location.search);
  if (params.get('mode') === 'signup') switchTab('signup');
});

// ── ÉVÉNEMENTS ────────────────────────────────────────────────
function bindAuthListeners() {
  $('theme-btn')?.addEventListener('click', toggleTheme);
  $('tab-login')?.addEventListener('click', () => switchTab('login'));
  $('tab-signup')?.addEventListener('click', () => switchTab('signup'));
  $('form-login')?.addEventListener('submit', handleLogin);
  $('form-signup')?.addEventListener('submit', handleSignup);
}

// ── TABS ──────────────────────────────────────────────────────
function switchTab(tab) {
  const isLogin = tab === 'login';
  $('tab-login')?.classList.toggle('active', isLogin);
  $('tab-signup')?.classList.toggle('active', !isLogin);
  if ($('form-login'))  $('form-login').style.display  = isLogin ? 'block' : 'none';
  if ($('form-signup')) $('form-signup').style.display = isLogin ? 'none'  : 'block';
  hideMessages();
}

// ── CONNEXION ─────────────────────────────────────────────────
async function handleLogin(e) {
  e.preventDefault();
  const email    = $('login-email').value.trim();
  const password = $('login-password').value;
  const btn      = $('login-btn');

  setLoading(btn, true, 'Connexion…');
  hideMessages();

  try {
    await signIn(email, password);
    showSuccess('Connexion réussie ! Redirection…');
    setTimeout(redirectAfterAuth, 800);
  } catch (err) {
    showError(translateError(err.message));
    setLoading(btn, false, 'Se connecter');
  }
}

// ── INSCRIPTION ───────────────────────────────────────────────
async function handleSignup(e) {
  e.preventDefault();
  const pseudo   = $('signup-pseudo').value.trim();
  const email    = $('signup-email').value.trim();
  const password = $('signup-password').value;
  const btn      = $('signup-btn');

  setLoading(btn, true, 'Création…');
  hideMessages();

  try {
    const user = await signUp(email, password, pseudo);
    // Supabase peut exiger une confirmation email selon la config du projet
    if (!user || user?.identities?.length === 0) {
      showSuccess('Compte créé ! Vérifiez vos emails pour confirmer votre adresse.');
      setLoading(btn, false, 'Créer mon compte');
    } else {
      showSuccess('Compte créé ! Redirection…');
      setTimeout(redirectAfterAuth, 800);
    }
  } catch (err) {
    showError(translateError(err.message));
    setLoading(btn, false, 'Créer mon compte');
  }
}

// ── REDIRECT ──────────────────────────────────────────────────
function redirectAfterAuth() {
  const redirect = sessionStorage.getItem(AUTH_REDIRECT_KEY) || 'quiz.html';
  sessionStorage.removeItem(AUTH_REDIRECT_KEY);
  window.location.href = redirect;
}

// ── MESSAGES ──────────────────────────────────────────────────
function showError(msg) {
  const el = $('auth-error');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

function showSuccess(msg) {
  const el = $('auth-success');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

function hideMessages() {
  if ($('auth-error'))   $('auth-error').style.display   = 'none';
  if ($('auth-success')) $('auth-success').style.display = 'none';
}

function setLoading(btn, loading, label) {
  if (!btn) return;
  btn.disabled    = loading;
  btn.textContent = label;
}

// Traduction des messages d'erreur Supabase en français
function translateError(msg) {
  if (msg.includes('Invalid login credentials'))  return 'Email ou mot de passe incorrect.';
  if (msg.includes('Email not confirmed'))         return 'Confirmez votre email avant de vous connecter.';
  if (msg.includes('User already registered'))     return 'Un compte existe déjà avec cet email.';
  if (msg.includes('Password should be'))          return 'Le mot de passe doit faire au moins 8 caractères.';
  if (msg.includes('Unable to validate'))          return 'Email invalide.';
  return msg;
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
