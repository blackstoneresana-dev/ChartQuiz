-- ============================================================
-- ChartQuiz — Script d'import des données (q-001 à q-004)
-- À exécuter dans l'éditeur SQL de ton projet Supabase
-- Dernière mise à jour : 2026-03-19
-- ============================================================

-- ── ÉTAPE 0 — Permissions rôle anon (GRANT) ─────────────────
-- Nécessaire pour que le client Supabase (clé anon) puisse lire les tables
-- RLS seul ne suffit pas — PostgreSQL refuse sans GRANT explicite

GRANT SELECT ON questions  TO anon;
GRANT SELECT ON options    TO anon;
GRANT SELECT ON images     TO anon;
GRANT INSERT ON responses  TO anon;
GRANT SELECT ON responses  TO anon;


-- ── ÉTAPE 1 — Mettre à jour les contraintes niveau ───────────
-- Ajoute 'avance' comme niveau valide dans les deux tables concernées

ALTER TABLE questions
  DROP CONSTRAINT IF EXISTS questions_niveau_check;
ALTER TABLE questions
  ADD CONSTRAINT questions_niveau_check
  CHECK (niveau IN ('debutant', 'intermediaire', 'avance'));

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_niveau_check;
ALTER TABLE users
  ADD CONSTRAINT users_niveau_check
  CHECK (niveau IN ('debutant', 'intermediaire', 'avance'));


-- ── ÉTAPE 2 — Supprimer les données de test existantes ───────
-- Le CASCADE supprime automatiquement les options et images liées

DELETE FROM questions WHERE id IN ('q-001', 'q-002', 'q-003', 'q-004');


-- ── ÉTAPE 3 — Insérer les questions ──────────────────────────

INSERT INTO questions (id, titre, niveau, explication_texte, actif) VALUES

('q-001',
 'Que va-t-il probablement se passer après cette configuration ?',
 'intermediaire',
 '1. Breach avec grosse demande. On peut voir que le prix est over-extended. Donc tu ne fais rien
2. High volume sur la demande et aussi au début du pullback
3. Début du pullback avec du volume? Donc stand-by
4. On peut voir qu''il y a un petit accepted Price qui est maintenu. Si tu veux c''est là tu trade la deuxième jambe du pullback
5. Deuxième jambe du pullback qui fait un breach
6. Le SR répond et pousse le prix vers le sud
7. Le mouvement est bien intense. C''est la première tentative des vendeurs. A ce stade, si on veut vendre, on attend de voir si la réponse des acheteurs va faire un plus haut
8. On peut voir qu''il n''y a pas de plus haut, le prix a commencé par descendre
9. Le prix est descendu deux fois avec intensité
10. Faible réaction des acheteurs.',
 true),

('q-002',
 'Que va-t-il probablement se passer après cette configuration ?',
 'avance',
 '1. Breach avec grosse demande. On peut voir que le prix est over-extended. Donc tu ne fais rien
2. Il y a un range durant le développement de la tendance. Donc faire attention à ce Price point.
3. On a du volume au niveau du range. Ce qui peut être très interessant
4. Première jambe de pullback. On attend de voir où cela va s''arrêter
5. Accepted price pour la premiere jambe de pullback
6. Week seller. On peut s''attendre à ce que le niveau avec le range réagisse',
 true),

('q-003',
 'Que va-t-il probablement se passer après cette configuration ?',
 'intermediaire',
 'Anticipation Sharp Reversal
1. On peut voir que le prix est trop monté. Une forme de over-extended si bien qu''il ne faisait plus de higher high
2. On a eu du volume au dessus de la moyenne et malgré cela le prix n''est pas monté
3. Mais on peut voir que les creux faisaient des plus haut. On entre comme ça dans une congestion. Et dans une congestion on attend la cassure. Pas pour suivre dans le sens de la cassure mais pour voir la réponse après
4. La cassure est arrivée. On attend de voir la réponse
5. Il y a rejet. Et le prix a commencé par s''affaiblir dans la descente, faisant un peu de over-extended. On attend que ça stabilise avant de sauter dans le train',
 true),

('q-004',
 'Que va-t-il probablement se passer après cette configuration ?',
 'debutant',
 '1. Tendance haussière mais qui commence à ralentir
2. Le premier plus haut
3. Réaction des vendeurs qui est un peu intense
4. Les acheteurs reprennent le mouvement haussier mais ne vont pas plus haut que le précédent sommet
5. Réaction des vendeurs qui est plus importante qu''à la phase 3. A ce stade on attend de voir. On ne peut rien anticiper pour la seule raison que les vendeurs sont forts et on ne sait pas là ou ils vont finir.
6. Le prix stabilise mais on ne peut pas encore se positionner. C''est la partie la plus difficile
7. A ce stade on peut voir qu''il y a eu de la volatilité mais je n''ai pas cassé le range. Je peux déjà commencer par m''intéresser à ce qui pourrait se passer en mettant par exemple une alerte sur la résistance pour être informé d''un kill. Je ne fais rien au kill. C''est après la réaction au kill que j''évalue ce qu''il y a à faire
8. Le mouvement volatile est soutenu par du volume. Ce qui est très interessant
9. Nous avons eu le prix qui est monté mais de manière très nonchalante. On attend de voir ce qu''il va se passer. Durant sa montée on peut voir une petite pause qu''il y a eu. Attention à ce spot
10. Il y a eu réaction des acheteurs. C''est surtout le canal haussier qu''il y a eu après cette réaction qui est interessante pour l''entrée',
 true);


-- ── ÉTAPE 4 — Insérer les options ────────────────────────────
-- 3 lignes par question, un seul est_correcte = true

INSERT INTO options (question_id, texte, est_correcte) VALUES
  ('q-001', 'UP',       false),
  ('q-001', 'DOWN',     true),
  ('q-001', 'SIDEWAYS', false),

  ('q-002', 'UP',       true),
  ('q-002', 'DOWN',     false),
  ('q-002', 'SIDEWAYS', false),

  ('q-003', 'UP',       false),
  ('q-003', 'DOWN',     true),
  ('q-003', 'SIDEWAYS', false),

  ('q-004', 'UP',       true),
  ('q-004', 'DOWN',     false),
  ('q-004', 'SIDEWAYS', false);


-- ── ÉTAPE 5 — Insérer les images (URLs Cloudinary) ───────────

INSERT INTO images (question_id, url_avant, url_apres, url_explication, source_info) VALUES

('q-001',
 'https://res.cloudinary.com/dh4cnlh03/image/upload/chart_q001_avant_gpzrca.png',
 'https://res.cloudinary.com/dh4cnlh03/image/upload/chart_q001_apres_b3ewzh.png',
 'https://res.cloudinary.com/dh4cnlh03/image/upload/chart_q001_explication_ybukwv.png',
 'AUDUSD M15 Oct 2025'),

('q-002',
 'https://res.cloudinary.com/dh4cnlh03/image/upload/chart_q002_avant_lfc8jy.png',
 'https://res.cloudinary.com/dh4cnlh03/image/upload/chart_q002_apres_bga620.png',
 'https://res.cloudinary.com/dh4cnlh03/image/upload/chart_q002_explication_hpdrmj.png',
 'GBPUSD M5 Fev 2025'),

('q-003',
 'https://res.cloudinary.com/dh4cnlh03/image/upload/chart_q003_avant_uzq6fo.png',
 'https://res.cloudinary.com/dh4cnlh03/image/upload/chart_q003_apres_tn8w88.png',
 'https://res.cloudinary.com/dh4cnlh03/image/upload/chart_q003_explication_l0g2sb.png',
 'NZDCHF M15 Jan 2025'),

('q-004',
 'https://res.cloudinary.com/dh4cnlh03/image/upload/chart_q004_avant_htjcgv.png',
 'https://res.cloudinary.com/dh4cnlh03/image/upload/chart_q004_apres_cl1o7d.png',
 'https://res.cloudinary.com/dh4cnlh03/image/upload/chart_q004_explication_ttj6lk.png',
 'AUDCHF M15 Jan 2025');


-- ── VÉRIFICATION ─────────────────────────────────────────────
-- Coller ces requêtes après l'import pour vérifier

-- SELECT id, titre, niveau, actif FROM questions ORDER BY id;
-- SELECT question_id, texte, est_correcte FROM options ORDER BY question_id, texte;
-- SELECT question_id, source_info FROM images ORDER BY question_id;
