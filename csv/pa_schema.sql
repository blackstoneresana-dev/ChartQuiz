-- ============================================================
-- ChartQuiz — Schéma Post Analysis (pa_*)
-- À exécuter dans l'éditeur SQL de ton projet Supabase
-- ============================================================

-- ── TABLES ───────────────────────────────────────────────────

CREATE TABLE pa_questions (
  id                text PRIMARY KEY,         -- 'pa-001', 'pa-002'...
  titre             text NOT NULL,
  explication_texte text,
  bonne_reponse     text NOT NULL CHECK (bonne_reponse IN ('RIGHT', 'WRONG')),
  actif             boolean DEFAULT true,
  created_at        timestamp with time zone DEFAULT now()
);

CREATE TABLE pa_images (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id  text REFERENCES pa_questions(id) ON DELETE CASCADE,
  url_avant_1  text NOT NULL,
  url_avant_2  text NOT NULL,
  url_apres_1  text NOT NULL,
  url_apres_2  text NOT NULL,
  source_info  text
);

CREATE TABLE pa_responses (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES users(id),
  question_id  text REFERENCES pa_questions(id),
  session_id   uuid,
  choix        text NOT NULL CHECK (choix IN ('RIGHT', 'WRONG')),
  est_correcte boolean NOT NULL,
  created_at   timestamp with time zone DEFAULT now()
);


-- ── RLS ──────────────────────────────────────────────────────

ALTER TABLE pa_questions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE pa_images     ENABLE ROW LEVEL SECURITY;
ALTER TABLE pa_responses  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture publique pa_questions"
  ON pa_questions FOR SELECT USING (true);

CREATE POLICY "Lecture publique pa_images"
  ON pa_images FOR SELECT USING (true);

CREATE POLICY "Insert pa_responses"
  ON pa_responses FOR INSERT WITH CHECK (true);

CREATE POLICY "Lecture propre pa_responses"
  ON pa_responses FOR SELECT USING (auth.uid() = user_id);


-- ── GRANTS ───────────────────────────────────────────────────

GRANT SELECT ON pa_questions  TO anon;
GRANT SELECT ON pa_images     TO anon;
GRANT INSERT ON pa_responses  TO anon;
GRANT SELECT ON pa_responses  TO anon;


-- ── VÉRIFICATION ─────────────────────────────────────────────
-- SELECT * FROM pa_questions ORDER BY id;
-- SELECT * FROM pa_images ORDER BY question_id;
