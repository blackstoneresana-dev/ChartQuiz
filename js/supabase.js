// ============================================================
// ChartQuiz — Client Supabase + fonctions DB
// ============================================================

const SUPABASE_URL      = 'https://sagbsylvqxeisbqcnupb.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_H5Az5UewihranMkw_f5M4w_XZbnwO5u';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── SESSIONS ─────────────────────────────────────────────────
function getOrCreateSessionId() {
  let sid = localStorage.getItem('chartquiz-session');
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem('chartquiz-session', sid);
  }
  return sid;
}

function resetSession() {
  const sid = crypto.randomUUID();
  localStorage.setItem('chartquiz-session', sid);
  return sid;
}

// ── UTILITAIRE PRIVÉ — évite la duplication du filtre niveau ─
// Appliqué dans loadRandomQuestion et loadQuestionsForSession
function buildActiveQuery(niveau) {
  let q = db.from('questions').select('id').eq('actif', true);
  if (niveau) q = q.eq('niveau', niveau);
  return q;
}

// ── QUESTIONS ─────────────────────────────────────────────────
async function loadQuestionById(id) {
  const [qRes, optsRes, imgRes] = await Promise.all([
    db.from('questions').select('*').eq('id', id).single(),
    db.from('options').select('*').eq('question_id', id),
    db.from('images').select('*').eq('question_id', id).single(),
  ]);
  if (qRes.error)   throw new Error(`Question introuvable (${id}) : ${qRes.error.message}`);
  if (imgRes.error) throw new Error(`Image introuvable (${id}) : ${imgRes.error.message}`);
  return {
    question: qRes.data,
    options:  optsRes.data ?? [],
    image:    imgRes.data,
  };
}

async function loadRandomQuestion(niveau = null) {
  const { data: questions, error } = await buildActiveQuery(niveau);
  if (error)              throw new Error(`Chargement questions échoué : ${error.message}`);
  if (!questions?.length) throw new Error('Aucune question disponible');
  const q = questions[Math.floor(Math.random() * questions.length)];
  return loadQuestionById(q.id);
}

async function loadQuestionsForSession(count = 5, niveau = null) {
  const { data: all, error } = await buildActiveQuery(niveau);
  if (error)       throw new Error(`Chargement session échoué : ${error.message}`);
  if (!all?.length) throw new Error('Aucune question disponible');
  const shuffled = all.sort(() => Math.random() - 0.5).slice(0, count);
  return Promise.all(shuffled.map(q => loadQuestionById(q.id)));
}

// ── RÉPONSES ──────────────────────────────────────────────────
async function saveResponse({ question_id, session_id, direction, est_correcte, commentaire, user_id = null }) {
  const { error } = await db.from('responses').insert({
    question_id,
    session_id,
    direction,
    est_correcte,
    commentaire: commentaire?.trim() || null,
    user_id,
  });
  if (error) throw new Error(`Sauvegarde réponse échouée : ${error.message}`);
}

// ── AUTH ──────────────────────────────────────────────────────
async function getCurrentUser() {
  const { data: { user } } = await db.auth.getUser();
  return user; // null si non connecté
}

async function signIn(email, password) {
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Connexion échouée : ${error.message}`);
  return data.user;
}

async function getUserProfile(userId) {
  const { data } = await db.from('users').select('pseudo, niveau').eq('id', userId).single();
  return data; // { pseudo, niveau } ou null
}

// Crée le profil dans public.users s'il n'existe pas encore
// (cas : signup échoué silencieusement ou migration de compte existant)
async function ensureUserProfile(userId, email, pseudo) {
  const { error } = await db.from('users').upsert(
    { id: userId, email, pseudo: pseudo || null },
    { onConflict: 'id', ignoreDuplicates: true }
  );
  if (error) console.warn('[ChartQuiz] Ensure profil:', error.message);
}

async function signUp(email, password, pseudo) {
  const { data, error } = await db.auth.signUp({
    email,
    password,
    options: { data: { pseudo: pseudo?.trim() || null } },  // stocké dans user_metadata
  });
  if (error) throw new Error(`Inscription échouée : ${error.message}`);
  // Créer l'entrée dans public.users (liée à auth.users via même id)
  if (data.user) {
    const { error: uErr } = await db.from('users').insert({
      id:     data.user.id,
      email,
      pseudo: pseudo?.trim() || null,
    });
    if (uErr) console.warn('[ChartQuiz] Création profil échouée (non bloquant) :', uErr.message);
  }
  return data.user;
}

async function signOut() {
  const { error } = await db.auth.signOut();
  if (error) throw new Error(`Déconnexion échouée : ${error.message}`);
}

// ── DASHBOARD ─────────────────────────────────────────────────
async function loadUserResponses(userId) {
  const { data, error } = await db
    .from('responses')
    .select('direction, est_correcte, question_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(`Chargement historique échoué : ${error.message}`);
  return (data ?? []).map(r => ({ ...r, quiz_type: 'direction' }));
}

async function loadPAUserResponses(userId) {
  const { data, error } = await db
    .from('pa_responses')
    .select('choix, est_correcte, question_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(`Chargement historique PA échoué : ${error.message}`);
  return (data ?? []).map(r => ({ ...r, quiz_type: 'pa', direction: null }));
}

async function loadQuestionsLevels() {
  const { data, error } = await db
    .from('questions')
    .select('id, niveau')
    .eq('actif', true);
  if (error) throw new Error(`Chargement niveaux échoué : ${error.message}`);
  return data ?? [];
}

// ── POST ANALYSIS ─────────────────────────────────────────────
async function loadPAQuestionById(id) {
  const [qRes, imgRes] = await Promise.all([
    db.from('pa_questions').select('*').eq('id', id).single(),
    db.from('pa_images').select('*').eq('question_id', id).single(),
  ]);
  if (qRes.error)   throw new Error(`PA Question introuvable (${id}) : ${qRes.error.message}`);
  if (imgRes.error) throw new Error(`PA Image introuvable (${id}) : ${imgRes.error.message}`);
  return { question: qRes.data, image: imgRes.data };
}

async function loadPAQuestionsForSession(count = 5) {
  const { data: all, error } = await db
    .from('pa_questions')
    .select('id')
    .eq('actif', true);
  if (error)        throw new Error(`Chargement PA session échoué : ${error.message}`);
  if (!all?.length) throw new Error('Aucune question Post Analysis disponible');
  const shuffled = all.sort(() => Math.random() - 0.5).slice(0, count);
  return Promise.all(shuffled.map(q => loadPAQuestionById(q.id)));
}

async function savePAResponse({ question_id, session_id, choix, est_correcte, user_id = null }) {
  const { error } = await db.from('pa_responses').insert({
    question_id,
    session_id,
    choix,
    est_correcte,
    user_id,
  });
  if (error) throw new Error(`Sauvegarde PA réponse échouée : ${error.message}`);
}

