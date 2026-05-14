// ============================================================
// ChartQuiz — Logique page d'accueil
// Dépend de : js/supabase.js (chargé avant dans index.html)
// ============================================================

function $(id) {
  const el = document.getElementById(id);
  if (!el) console.warn(`[ChartQuiz] Élément #${id} introuvable`);
  return el;
}

// ── THÈME ─────────────────────────────────────────────────────
function updateThemeBtn() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  $('theme-btn').textContent = isDark ? '☀' : '☽';
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
function openSidebar() {
  $('sidebar')?.classList.add('open');
  $('sidebar-overlay')?.classList.add('visible');
}

function closeSidebar() {
  $('sidebar')?.classList.remove('open');
  $('sidebar-overlay')?.classList.remove('visible');
}

// ── AUTH ──────────────────────────────────────────────────────
async function handleLogout() {
  await db.auth.signOut();
  window.location.href = 'auth.html';
}

function updateUserDisplay(user, profile) {
  const badge = $('user-badge');
  if (!badge) return;
  const pseudo = profile?.pseudo || user.user_metadata?.pseudo;
  const label  = pseudo || user.email?.split('@')[0] || 'Trader';
  badge.textContent = label.toUpperCase();
}

// ── INIT ──────────────────────────────────────────────────────
async function init() {
  updateThemeBtn();

  $('theme-btn')?.addEventListener('click', toggleTheme);
  $('sidebar-toggle')?.addEventListener('click', openSidebar);
  $('sidebar-close')?.addEventListener('click', closeSidebar);
  $('sidebar-overlay')?.addEventListener('click', closeSidebar);
  $('logout-btn')?.addEventListener('click', handleLogout);

  const user = await getCurrentUser();
  if (!user) {
    sessionStorage.setItem('chartquiz-auth-redirect', 'index.html');
    window.location.href = 'auth.html';
    return;
  }

  await ensureUserProfile(user.id, user.email, user.user_metadata?.pseudo).catch(() => null);
  const profile = await getUserProfile(user.id).catch(() => null);
  updateUserDisplay(user, profile);
}

document.addEventListener('DOMContentLoaded', init);
