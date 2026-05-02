// ============================================================
// ChartQuiz — Logique du Dashboard
// Dépend de : js/supabase.js (chargé avant dans dashboard.html)
// ============================================================

// ── ÉTAT ──────────────────────────────────────────────────────
const dashState = {
  userId:    null,
  activeTab: localStorage.getItem('dashboard-tab') || 'all',
};

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
  initDashboard();
});

function bindEventListeners() {
  $('theme-btn')?.addEventListener('click', toggleTheme);
  $('logout-btn')?.addEventListener('click', handleLogout);
  $('sidebar-toggle')?.addEventListener('click', toggleSidebar);
  $('sidebar-close')?.addEventListener('click', closeSidebar);
  $('sidebar-overlay')?.addEventListener('click', closeSidebar);
  document.querySelectorAll('.dash-tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
}

async function initDashboard() {
  try {
    showLoading(true);

    const user = await getCurrentUser();
    if (!user) {
      sessionStorage.setItem('chartquiz-auth-redirect', 'dashboard.html');
      window.location.href = 'auth.html';
      return;
    }
    dashState.userId = user.id;

    const profile = await getUserProfile(user.id).catch(() => null);
    updateUserDisplay(user, profile);

    const [dirResponses, paResponses, wtdResponses, questions] = await Promise.all([
      loadUserResponses(user.id),
      loadPAUserResponses(user.id),
      loadWTDUserResponses(user.id),
      loadQuestionsLevels(),
    ]);

    const allResponses = [...dirResponses, ...paResponses, ...wtdResponses];

    if (allResponses.length === 0) {
      showEmpty();
    } else {
      const stats = computeAllStats(dirResponses, paResponses, wtdResponses, questions);
      renderDashboard(stats);
    }
  } catch (e) {
    console.error('[ChartQuiz] Erreur dashboard:', e);
    showError(`Erreur : ${e?.message || e}`);
  } finally {
    showLoading(false);
    $('dash-main')?.classList.remove('hidden');
  }
}

// ── CALCUL DES STATS ──────────────────────────────────────────
function computeAllStats(dirResponses, paResponses, wtdResponses, questions) {
  const allResponses = [...dirResponses, ...paResponses, ...wtdResponses]
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  const total = allResponses.length;

  const sorted = [...allResponses].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  let streak = 0;
  for (const r of sorted) {
    if (r.est_correcte) streak++;
    else break;
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const activeDays = new Set(
    allResponses
      .filter(r => new Date(r.created_at) >= thirtyDaysAgo)
      .map(r => r.created_at.slice(0, 10))
  ).size;

  const activity = {};
  for (const r of allResponses) {
    const day = r.created_at.slice(0, 10);
    activity[day] = (activity[day] || 0) + 1;
  }

  const levelMap = Object.fromEntries(questions.map(q => [q.id, q.niveau]));

  return {
    total,
    streak,
    activeDays,
    activity,
    allResponses,
    dir: computeQuizStats(dirResponses, levelMap, 'direction'),
    pa:  computeQuizStats(paResponses,  levelMap, 'pa'),
    wtd: computeQuizStats(wtdResponses, levelMap, 'wtd'),
  };
}

function computeQuizStats(responses, levelMap, quizType) {
  if (!responses.length) {
    return { total: 0, correct: 0, rate: null, toRedo: [], lastDate: null, byDirection: null, chosenSplit: null };
  }

  const total   = responses.length;
  const correct = responses.filter(r => r.est_correcte).length;
  const rate    = Math.round(correct / total * 100);
  const lastDate = responses[responses.length - 1]?.created_at?.slice(0, 10);

  const wrongMap = {};
  for (const r of responses) {
    if (!r.est_correcte) {
      const key = r.question_id;
      if (!wrongMap[key]) {
        wrongMap[key] = {
          count:       0,
          question_id: r.question_id,
          direction:   null,
          niveau:      levelMap[r.question_id] || null,
        };
      }
      wrongMap[key].count++;
      if (r.direction) wrongMap[key].direction = r.direction;
    }
  }
  const toRedo = Object.values(wrongMap).sort((a, b) => b.count - a.count).slice(0, 5);

  let byDirection = null;
  if (quizType === 'direction') {
    byDirection = {};
    for (const dir of ['UP', 'DOWN', 'SIDEWAYS']) {
      const dr = responses.filter(r => r.direction === dir);
      const dc = dr.filter(r => r.est_correcte).length;
      byDirection[dir] = {
        total:   dr.length,
        correct: dc,
        rate:    dr.length > 0 ? Math.round(dc / dr.length * 100) : null,
      };
    }
  }

  let chosenSplit = null;
  if (quizType === 'pa') {
    const rightChosen  = responses.filter(r => r.choix === 'RIGHT').length;
    const wrongChosen  = responses.filter(r => r.choix === 'WRONG').length;
    const rightCorrect = responses.filter(r => r.choix === 'RIGHT' && r.est_correcte).length;
    const wrongCorrect = responses.filter(r => r.choix === 'WRONG' && r.est_correcte).length;
    chosenSplit = { rightChosen, wrongChosen, rightCorrect, wrongCorrect };
  }

  return { total, correct, rate, lastDate, toRedo, byDirection, chosenSplit };
}

// ── RENDU ─────────────────────────────────────────────────────
function renderDashboard(stats) {
  renderOverviewKPI(stats);
  renderCompareCards(stats);
  renderDirectionTab(stats.dir);
  renderPATab(stats.pa);
  renderWTDTab(stats.wtd);
  renderPerfChart(stats.allResponses);
  renderActivity(stats.activity);
  switchTab(dashState.activeTab);
  $('dash-empty')?.classList.add('hidden');
  $('dash-stats')?.classList.remove('hidden');
}

function renderOverviewKPI({ total, streak, activeDays }) {
  const streakEl = $('streak-num');
  if (streakEl) streakEl.textContent = streak;

  const streakSub = $('streak-sub');
  if (streakSub) streakSub.textContent = streak <= 1 ? 'bonne réponse consécutive' : 'bonnes réponses consécutives';

  const totalEl = $('total-num');
  if (totalEl) totalEl.textContent = total;

  const activeDaysEl = $('active-days');
  if (activeDaysEl) activeDaysEl.textContent = activeDays;
}

function renderCompareCards({ dir, pa, wtd }) {
  const container = $('compare-grid');
  if (!container) return;

  const cards = [
    { cls: 'compare-card-dir', name: 'Direction Quiz',  stats: dir, tab: 'direction' },
    { cls: 'compare-card-pa',  name: 'Post Analysis',   stats: pa,  tab: 'pa'        },
    { cls: 'compare-card-wtd', name: 'What Do You Do',  stats: wtd, tab: 'wtd'       },
  ];

  container.innerHTML = cards.map(({ cls, name, stats, tab }) => {
    const rateDisplay = stats.rate !== null ? `${stats.rate}%` : '—';
    const detail = stats.total > 0
      ? `${stats.total} réponse${stats.total > 1 ? 's' : ''} · dernière : ${formatDate(stats.lastDate)}`
      : 'Aucune réponse enregistrée';
    const barWidth = stats.rate ?? 0;

    return `
    <div class="compare-card ${cls}">
      <div class="compare-card-name">${name}</div>
      <div class="compare-card-rate">${rateDisplay}</div>
      <div class="compare-card-detail">${detail}</div>
      <div class="compare-card-bar-track">
        <div class="compare-card-bar-fill" style="width:${barWidth}%"></div>
      </div>
      <button class="compare-card-link" onclick="switchTab('${tab}')">Voir les détails →</button>
    </div>`;
  }).join('');
}

function renderDirectionTab(dir) {
  const kpiRow = $('dir-kpi-row');
  if (kpiRow) {
    kpiRow.innerHTML = `
      <div class="stat-card">
        <div class="stat-card-label">Taux de réussite</div>
        <div class="stat-big-num">${dir.rate !== null ? dir.rate + '%' : '—'}</div>
        <div class="stat-card-detail">${dir.correct} / ${dir.total} correctes</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">Réponses</div>
        <div class="stat-big-num">${dir.total || '—'}</div>
        <div class="stat-card-detail">${dir.lastDate ? 'Dernière : ' + formatDate(dir.lastDate) : 'Aucune session'}</div>
      </div>`;
  }

  if (dir.byDirection) {
    const circumference = 326.7;
    const arc = $('donut-arc');
    if (arc) {
      const filled = dir.total > 0 ? ((dir.rate ?? 0) / 100) * circumference : 0;
      setTimeout(() => arc.setAttribute('stroke-dasharray', `${filled.toFixed(1)} ${circumference}`), 100);
    }
    const donutTotal = $('donut-total');
    if (donutTotal) donutTotal.textContent = dir.total || '—';

    const container = $('dir-stats');
    if (container) {
      const DIRS = [
        { key: 'UP',       icon: '↑', cls: 'dir-up'  },
        { key: 'DOWN',     icon: '↓', cls: 'dir-down' },
        { key: 'SIDEWAYS', icon: '↔', cls: 'dir-side' },
      ];
      container.innerHTML = DIRS.map(({ key, icon, cls }) => {
        const { total, correct, rate } = dir.byDirection[key];
        return `
          <div class="dir-stat-row ${cls}">
            <span class="dir-stat-icon">${icon}</span>
            <span class="dir-stat-name">${key}</span>
            <span class="dir-stat-rate">${rate !== null ? rate + '%' : '—'}</span>
            <span class="dir-stat-detail">${correct} / ${total}</span>
          </div>`;
      }).join('');
    }
  }

  renderRedoList($('dir-redo-list'), dir.toRedo, 'direction');
}

function renderPATab(pa) {
  const kpiRow = $('pa-kpi-row');
  if (kpiRow) {
    kpiRow.innerHTML = `
      <div class="stat-card">
        <div class="stat-card-label">Taux de réussite</div>
        <div class="stat-big-num">${pa.rate !== null ? pa.rate + '%' : '—'}</div>
        <div class="stat-card-detail">${pa.correct} / ${pa.total} correctes</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">Réponses</div>
        <div class="stat-big-num">${pa.total || '—'}</div>
        <div class="stat-card-detail">${pa.lastDate ? 'Dernière : ' + formatDate(pa.lastDate) : 'Aucune session'}</div>
      </div>`;
  }

  const splitEl = $('pa-split');
  if (splitEl) {
    if (pa.chosenSplit && pa.total > 0) {
      const { rightChosen, wrongChosen, rightCorrect, wrongCorrect } = pa.chosenSplit;
      const rightRate = rightChosen > 0 ? Math.round(rightCorrect / rightChosen * 100) : 0;
      const wrongRate = wrongChosen > 0 ? Math.round(wrongCorrect / wrongChosen * 100) : 0;
      splitEl.innerHTML = `
        <div class="pa-split-row">
          <div class="pa-split-card">
            <div class="pa-split-label">Ont choisi RIGHT</div>
            <div class="pa-split-num" style="color:var(--up)">${rightChosen}</div>
            <div class="pa-split-sub">${rightRate}% corrects</div>
          </div>
          <div class="pa-split-card">
            <div class="pa-split-label">Ont choisi WRONG</div>
            <div class="pa-split-num" style="color:var(--down)">${wrongChosen}</div>
            <div class="pa-split-sub">${wrongRate}% corrects</div>
          </div>
        </div>`;
    } else {
      splitEl.innerHTML = '<div class="redo-empty" style="margin-bottom:1.5rem;">Aucune donnée disponible.</div>';
    }
  }

  renderRedoList($('pa-redo-list'), pa.toRedo, 'pa');
}

function renderWTDTab(wtd) {
  const kpiRow = $('wtd-kpi-row');
  if (kpiRow) {
    kpiRow.innerHTML = `
      <div class="stat-card">
        <div class="stat-card-label">Taux de réussite</div>
        <div class="stat-big-num">${wtd.rate !== null ? wtd.rate + '%' : '—'}</div>
        <div class="stat-card-detail">${wtd.correct} / ${wtd.total} correctes</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">Réponses</div>
        <div class="stat-big-num">${wtd.total || '—'}</div>
        <div class="stat-card-detail">${wtd.lastDate ? 'Dernière : ' + formatDate(wtd.lastDate) : 'Aucune session'}</div>
      </div>`;
  }

  renderRedoList($('wtd-redo-list'), wtd.toRedo, 'wtd');
}

function renderRedoList(container, toRedo, quizType) {
  if (!container) return;

  if (!toRedo.length) {
    container.innerHTML = '<div class="redo-empty">Aucune erreur récurrente — continue comme ça !</div>';
    return;
  }

  const QUIZ_LINKS    = { direction: 'quiz.html', pa: 'post-analysis.html', wtd: 'what-do-you-do.html' };
  const DIR_CLS       = { UP: 'redo-tag-up', DOWN: 'redo-tag-down', SIDEWAYS: 'redo-tag-side' };
  const NIVEAU_LABELS = { debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé' };

  const link = QUIZ_LINKS[quizType] || 'index.html';

  container.innerHTML = toRedo.map(({ question_id, count, direction, niveau }) => {
    const num = question_id.replace(/^(q|pa|wtd)-/, '');

    const dirTag = (quizType === 'direction' && direction)
      ? `<span class="redo-tag ${DIR_CLS[direction] || ''}">${direction}</span>`
      : '';
    const niveauTag = niveau
      ? `<span class="redo-tag redo-tag-niveau">${NIVEAU_LABELS[niveau] || niveau}</span>`
      : '';

    return `
    <div class="redo-item">
      <div class="redo-item-left">
        <div class="redo-id">#${num}</div>
        <div class="redo-tags">${dirTag}${niveauTag}</div>
      </div>
      <div class="redo-item-right">
        <span class="redo-count">${count} erreur${count > 1 ? 's' : ''}</span>
        <a class="rejouer-btn" href="${link}">Rejouer →</a>
      </div>
    </div>`;
  }).join('');
}

// ── COURBE DE PERFORMANCE ─────────────────────────────────────
let perfChartInstance = null;

function renderPerfChart(allResponses) {
  const canvas = $('perf-chart');
  const empty  = $('perf-empty');
  if (!canvas) return;

  dashState.lastResponses = allResponses;

  const today = new Date();
  const days  = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }

  const perDay = {};
  for (const r of allResponses) {
    const day = r.created_at.slice(0, 10);
    if (!perDay[day]) perDay[day] = { total: 0, correct: 0 };
    perDay[day].total++;
    if (r.est_correcte) perDay[day].correct++;
  }

  let cumTotal = 0, cumCorrect = 0;
  const data = days.map(day => {
    if (perDay[day]) {
      cumTotal   += perDay[day].total;
      cumCorrect += perDay[day].correct;
    }
    return cumTotal > 0 ? Math.round(cumCorrect / cumTotal * 100) : null;
  });

  const hasData = data.some(v => v !== null);
  if (!hasData) {
    canvas.style.display = 'none';
    empty?.classList.remove('hidden');
    return;
  }
  canvas.style.display = 'block';
  empty?.classList.add('hidden');

  const labels = days.map(d => {
    const [, m, day] = d.split('-');
    return `${parseInt(day)}/${parseInt(m)}`;
  });

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const accent = isDark ? '#E8D8B8' : '#7c6aff';
  const muted  = isDark ? 'rgba(237,232,223,0.5)' : '#888899';
  const grid   = isDark ? 'rgba(237,232,223,0.08)' : 'rgba(0,0,0,0.06)';

  if (perfChartInstance) perfChartInstance.destroy();

  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 220);
  gradient.addColorStop(0, isDark ? 'rgba(232,216,184,0.25)' : 'rgba(124,106,255,0.25)');
  gradient.addColorStop(1, isDark ? 'rgba(232,216,184,0)'    : 'rgba(124,106,255,0)');

  perfChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Taux de réussite cumulé',
        data,
        borderColor: accent,
        backgroundColor: gradient,
        fill: true,
        tension: 0.35,
        spanGaps: true,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: accent,
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
        borderWidth: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isDark ? '#0a0a0f' : '#0f0f18',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: accent,
          borderWidth: 1,
          padding: 10,
          displayColors: false,
          callbacks: {
            label: ctx => ctx.parsed.y !== null ? `${ctx.parsed.y}% cumulé` : 'Aucune donnée',
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: muted, font: { family: 'JetBrains Mono', size: 10 }, maxTicksLimit: 8 },
        },
        y: {
          min: 0, max: 100,
          grid: { color: grid, drawBorder: false },
          ticks: {
            color: muted,
            font: { family: 'JetBrains Mono', size: 10 },
            stepSize: 25,
            callback: v => v + '%',
          },
        },
      },
    },
  });
}

function renderActivity(activity) {
  const container = $('activity-grid');
  if (!container) return;

  const today = new Date();
  const days  = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }

  container.innerHTML = days.map(day => {
    const count = activity[day] || 0;
    const level = count === 0 ? 'none' : count <= 2 ? 'low' : count <= 5 ? 'mid' : 'high';
    const label = count === 0 ? 'Aucune réponse' : `${count} réponse${count > 1 ? 's' : ''}`;
    return `<div class="activity-dot activity-${level}" title="${day} — ${label}"></div>`;
  }).join('');
}

// ── TABS ──────────────────────────────────────────────────────
function switchTab(tabName) {
  const validTabs = ['all', 'direction', 'pa', 'wtd'];
  if (!validTabs.includes(tabName)) tabName = 'all';

  dashState.activeTab = tabName;
  localStorage.setItem('dashboard-tab', tabName);

  document.querySelectorAll('.dash-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
  document.querySelectorAll('.tab-content').forEach(el => {
    el.classList.toggle('active', el.id === `tab-${tabName}`);
  });
}

// ── UTILITAIRES ───────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  const months = ['jan.','fév.','mar.','avr.','mai','jui.','jul.','aoû.','sep.','oct.','nov.','déc.'];
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
}

function showEmpty() {
  $('dash-empty')?.classList.remove('hidden');
  $('dash-stats')?.classList.add('hidden');
}

// ── AUTH / UI ──────────────────────────────────────────────────
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
  if (perfChartInstance && dashState.lastResponses) {
    renderPerfChart(dashState.lastResponses);
  }
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

// ── LOADING / ERROR ───────────────────────────────────────────
function showLoading(visible) {
  const el = $('loading-state');
  if (el) el.style.display = visible ? 'block' : 'none';
}

function showError(msg) {
  const el = $('error-state');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}
