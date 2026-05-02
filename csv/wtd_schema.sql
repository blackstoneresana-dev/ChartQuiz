-- ============================================================
-- ChartQuiz — Schéma What Do You Do (wtd_*)
-- À exécuter dans l'éditeur SQL de ton projet Supabase
-- ============================================================

-- ── TABLES ───────────────────────────────────────────────────

CREATE TABLE wtd_questions (
  id                text PRIMARY KEY,         -- 'wtd-001', 'wtd-002'...
  titre             text NOT NULL,
  explication_texte text,
  actif             boolean DEFAULT true,
  created_at        timestamp with time zone DEFAULT now()
);

CREATE TABLE wtd_options (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id  text REFERENCES wtd_questions(id) ON DELETE CASCADE,
  texte        text NOT NULL,
  est_correcte boolean DEFAULT false
);

CREATE TABLE wtd_images (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id      text REFERENCES wtd_questions(id) ON DELETE CASCADE,
  url_avant        text NOT NULL,
  url_apres        text NOT NULL,
  url_explication  text NOT NULL,
  source_info      text
);

CREATE TABLE wtd_responses (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES users(id),
  question_id  text REFERENCES wtd_questions(id),
  session_id   uuid,
  option_id    uuid REFERENCES wtd_options(id),
  est_correcte boolean NOT NULL,
  created_at   timestamp with time zone DEFAULT now()
);


-- ── RLS ──────────────────────────────────────────────────────

ALTER TABLE wtd_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wtd_options   ENABLE ROW LEVEL SECURITY;
ALTER TABLE wtd_images    ENABLE ROW LEVEL SECURITY;
ALTER TABLE wtd_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture publique wtd_questions"
  ON wtd_questions FOR SELECT USING (true);

CREATE POLICY "Lecture publique wtd_options"
  ON wtd_options FOR SELECT USING (true);

CREATE POLICY "Lecture publique wtd_images"
  ON wtd_images FOR SELECT USING (true);

CREATE POLICY "Insert wtd_responses"
  ON wtd_responses FOR INSERT WITH CHECK (true);

CREATE POLICY "Lecture propre wtd_responses"
  ON wtd_responses FOR SELECT USING (auth.uid() = user_id);


-- ── GRANTS ───────────────────────────────────────────────────

GRANT SELECT ON wtd_questions TO anon, authenticated;
GRANT SELECT ON wtd_options   TO anon, authenticated;
GRANT SELECT ON wtd_images    TO anon, authenticated;
GRANT INSERT ON wtd_responses TO anon, authenticated;
GRANT SELECT ON wtd_responses TO anon, authenticated;


-- ── VÉRIFICATION ─────────────────────────────────────────────
-- SELECT * FROM wtd_questions ORDER BY id;
-- SELECT * FROM wtd_options ORDER BY question_id;
-- SELECT * FROM wtd_images ORDER BY question_id;
