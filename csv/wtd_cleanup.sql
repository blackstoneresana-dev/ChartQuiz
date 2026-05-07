-- ============================================================
-- ChartQuiz — Cleanup tables What Do You Do (wtd_*)
-- À exécuter dans l'éditeur SQL Supabase
-- Format WTD supprimé du code (commit d90eb1b)
-- ============================================================

-- Ordre : responses d'abord (FK vers questions/options), puis options/images, puis questions
DROP TABLE IF EXISTS wtd_responses CASCADE;
DROP TABLE IF EXISTS wtd_options   CASCADE;
DROP TABLE IF EXISTS wtd_images    CASCADE;
DROP TABLE IF EXISTS wtd_questions CASCADE;

-- Vérification
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'wtd_%';
-- Doit renvoyer 0 ligne
