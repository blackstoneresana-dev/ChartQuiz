-- ============================================================
-- ChartQuiz — Drop colonne source_info (Direction Quiz)
-- Reveal retiré du front session 12 — colonne plus utilisée
-- À exécuter dans l'éditeur SQL Supabase
-- ============================================================

ALTER TABLE images DROP COLUMN IF EXISTS source_info;

-- Vérification
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'images';
-- Doit lister : id, question_id, url_avant, url_apres, url_explication
