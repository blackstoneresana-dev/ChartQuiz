-- ============================================================
-- ChartQuiz — Post Analysis : ajout des colonnes "bonnes réponses analyse"
-- À exécuter dans l'éditeur SQL Supabase
-- ============================================================

ALTER TABLE pa_questions
  ADD COLUMN IF NOT EXISTS correct_setup     text
    CHECK (correct_setup IN ('Cheese trade LTF', 'Anticipation', 'Trend pullback classic')),
  ADD COLUMN IF NOT EXISTS correct_context   text,
  ADD COLUMN IF NOT EXISTS correct_edge      text,
  ADD COLUMN IF NOT EXISTS correct_signal    text,
  ADD COLUMN IF NOT EXISTS correct_execution text
    CHECK (correct_execution IN ('Good', 'Bad'));

-- ── VÉRIFICATION ─────────────────────────────────────────────
-- SELECT id, correct_setup, correct_execution FROM pa_questions LIMIT 5;
