-- ============================================================
-- ChartQuiz — Import pa-001 (WTICOUSD, Aug 29 2022)
-- ============================================================

INSERT INTO pa_questions (id, titre, explication_texte, bonne_reponse, actif) VALUES (
  'pa-001',
  'Ce trade était-il le bon ?',
  'Achat au niveau de la demand zone (93.162–94.102) sur WTICOUSD. La confluence sur les 3 timeframes (M5, M15, H1) confirmait la réaction des acheteurs avec du volume. Le prix a atteint le premier objectif à 96.359 puis a continué jusqu''à 97.30. C''était le bon trade à prendre.',
  'RIGHT',
  true
);

INSERT INTO pa_images (question_id, url_avant_1, url_avant_2, url_apres_1, url_apres_2, source_info) VALUES (
  'pa-001',
  'https://res.cloudinary.com/dh4cnlh03/image/upload/chart_pa001_avant_1_nshak8.png',
  'https://res.cloudinary.com/dh4cnlh03/image/upload/chart_pa001_avant_2_dwybow.png',
  'https://res.cloudinary.com/dh4cnlh03/image/upload/chart_pa001_apres_1_fhccpm.png',
  'https://res.cloudinary.com/dh4cnlh03/image/upload/chart_pa001_apres_2_gq0qb6.png',
  'WTICOUSD Aug 29 2022 — OANDA'
);

-- Vérification
SELECT q.id, q.titre, q.bonne_reponse, i.url_avant_1, i.url_apres_1
FROM pa_questions q
JOIN pa_images i ON i.question_id = q.id
WHERE q.id = 'pa-001';
