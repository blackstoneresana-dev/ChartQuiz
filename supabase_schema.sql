-- ============================================================
-- ChartQuiz — Schéma Supabase
-- À exécuter dans l'éditeur SQL de ton projet Supabase
-- ============================================================

-- TABLE questions
CREATE TABLE questions (
  id                text PRIMARY KEY,          -- format: q-001, q-002, q-003…
  titre             text NOT NULL,
  niveau            text CHECK (niveau IN ('debutant', 'intermediaire', 'avance')),
  explication_texte text,
  actif             boolean DEFAULT true,
  created_at        timestamptz DEFAULT now()
);

-- TABLE options
-- Toujours 3 lignes par question : UP, DOWN, SIDEWAYS (dans cet ordre)
-- Un seul est_correcte = true par question
CREATE TABLE options (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id  text NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  texte        text NOT NULL CHECK (texte IN ('UP', 'DOWN', 'SIDEWAYS')),
  est_correcte boolean DEFAULT false
);

-- TABLE images
-- 3 URLs Cloudinary par question + info source révélée en fin de test
CREATE TABLE images (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id     text NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  url_avant       text NOT NULL,
  url_apres       text NOT NULL,
  url_explication text NOT NULL,
  source_info     text              -- ex: "EURCAD · Daily · Oct 2023 · TradingView FXCM"
);

-- TABLE users
-- Sera liée à Supabase Auth (auth.users) lors de l'implémentation de l'authentification
CREATE TABLE users (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text UNIQUE,
  pseudo     text,
  niveau     text CHECK (niveau IN ('debutant', 'intermediaire', 'avance')),
  created_at timestamptz DEFAULT now()
);

-- TABLE responses
-- user_id nullable en phase 1 (pas d'auth) — obligatoire après implémentation auth
CREATE TABLE responses (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES users(id),
  question_id  text NOT NULL REFERENCES questions(id),
  session_id   uuid NOT NULL,                              -- généré côté client (localStorage)
  direction    text NOT NULL CHECK (direction IN ('UP', 'DOWN', 'SIDEWAYS')),
  est_correcte boolean NOT NULL,
  commentaire  text CHECK (char_length(commentaire) <= 200),
  created_at   timestamptz DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE questions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE options    ENABLE ROW LEVEL SECURITY;
ALTER TABLE images     ENABLE ROW LEVEL SECURITY;
ALTER TABLE users      ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses  ENABLE ROW LEVEL SECURITY;

-- Permissions rôle anon — OBLIGATOIRE en plus de RLS
-- RLS contrôle quelles lignes sont visibles, GRANT contrôle l'accès à la table
GRANT SELECT ON questions  TO anon;
GRANT SELECT ON options    TO anon;
GRANT SELECT ON images     TO anon;
GRANT INSERT ON responses  TO anon;
GRANT SELECT ON responses  TO anon;
GRANT INSERT ON users      TO anon;   -- requis pour le signup

-- Permissions rôle authenticated (utilisateurs connectés via Supabase Auth)
GRANT SELECT ON questions  TO authenticated;
GRANT SELECT ON options    TO authenticated;
GRANT SELECT ON images     TO authenticated;
GRANT INSERT ON responses  TO authenticated;
GRANT SELECT ON responses  TO authenticated;
GRANT INSERT ON users      TO authenticated;
GRANT SELECT ON users      TO authenticated;

-- Lecture publique des questions actives
CREATE POLICY "questions publiques"
  ON questions FOR SELECT
  USING (actif = true);

-- Lecture publique des options (filtrée par la RLS de questions)
CREATE POLICY "options publiques"
  ON options FOR SELECT
  USING (true);

-- Lecture publique des images
CREATE POLICY "images publiques"
  ON images FOR SELECT
  USING (true);

-- Insertion libre des réponses (phase 1, sans auth)
CREATE POLICY "insert responses libre"
  ON responses FOR INSERT
  WITH CHECK (true);

-- Lecture des réponses par session_id (le client connaît son session_id)
CREATE POLICY "select responses par session"
  ON responses FOR SELECT
  USING (true);

-- Création de profil au signup
CREATE POLICY "users peuvent créer leur profil"
  ON users FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Lecture du profil par l'utilisateur connecté (OBLIGATOIRE pour getUserProfile)
CREATE POLICY "users peuvent lire leur profil"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- ============================================================
-- DONNÉES DE TEST
-- Insérer une question de test pour valider l'intégration
-- (remplacer les URLs par de vraies URLs Cloudinary ensuite)
-- ============================================================

INSERT INTO questions (id, titre, niveau, explication_texte, actif) VALUES (
  'q-001',
  'Que va-t-il probablement se passer après cette configuration ?',
  'intermediaire',
  'Le marché forme une structure de continuation haussière classique après une correction en ABC. Le support dynamique est respecté et le volume confirme l''intérêt des acheteurs. La cible est le précédent sommet.',
  true
);

INSERT INTO options (question_id, texte, est_correcte) VALUES
  ('q-001', 'UP',       true),
  ('q-001', 'DOWN',     false),
  ('q-001', 'SIDEWAYS', false);

INSERT INTO images (question_id, url_avant, url_apres, url_explication, source_info) VALUES (
  'q-001',
  'https://placehold.co/900x500/0d0d0d/ffffff?text=AVANT+q-001',
  'https://placehold.co/900x500/0d0d0d/00c896?text=APRÈS+q-001',
  'https://placehold.co/900x500/0d0d0d/ffb84d?text=EXPLICATION+q-001',
  'EURUSD · H4 · Janvier 2024 · TradingView FXCM'
);
