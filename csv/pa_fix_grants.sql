-- ============================================================
-- ChartQuiz — Fix grants PA tables pour le rôle authenticated
-- À exécuter dans l'éditeur SQL Supabase
-- ============================================================

GRANT SELECT ON pa_questions TO authenticated;
GRANT SELECT ON pa_images    TO authenticated;
GRANT INSERT ON pa_responses TO authenticated;
GRANT SELECT ON pa_responses TO authenticated;
