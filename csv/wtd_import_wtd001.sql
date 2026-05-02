-- ============================================================
-- ChartQuiz — Import wtd-001 (CHFJPY H1, Mar 24 2026)
-- Remplacer les URLs COMING_SOON par les vraies URLs Cloudinary
-- avant d'exécuter.
-- ============================================================

INSERT INTO wtd_questions (id, titre, explication_texte, actif) VALUES (
  'wtd-001',
  'Que fais-tu dans cette situation ?',
  '1. Strong sellers
2. Follow by a strong buyers.
3. Both parties are fighting, creating a congestion. We wait for the congestion to break and the volatility to be back.',
  true
);

INSERT INTO wtd_options (question_id, texte, est_correcte) VALUES
  ('wtd-001', 'It''s a Sell. Take the sell now! Its now or never', false),
  ('wtd-001', 'It''s a buy. Take the buy now! Its now or never',   false),
  ('wtd-001', 'Wait for the congestion to break and evaluate',      true);

INSERT INTO wtd_images (question_id, url_avant, url_apres, url_explication, source_info) VALUES (
  'wtd-001',
  'https://res.cloudinary.com/dh4cnlh03/image/upload/chart_wtd001_avant_ujax9k.png',
  'https://res.cloudinary.com/dh4cnlh03/image/upload/chart_wtd001_apres_kd3sl3.png',
  'https://res.cloudinary.com/dh4cnlh03/image/upload/chart_wtd001_explication_i4hglb.png',
  'CHFJPY H1 Mar 2026 — FXCM'
);

-- Vérification
SELECT q.id, q.titre, o.texte, o.est_correcte, i.url_avant
FROM wtd_questions q
JOIN wtd_options o ON o.question_id = q.id
JOIN wtd_images  i ON i.question_id = q.id
WHERE q.id = 'wtd-001'
ORDER BY o.est_correcte ASC;
