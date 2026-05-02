-- ============================================================
-- ChartQuiz — Import What Do You Do wtd-002 → wtd-009
-- ============================================================

-- ----------- wtd_questions -----------
INSERT INTO wtd_questions (id, titre, explication_texte, actif) VALUES
('wtd-002', 'Que fais-tu dans cette situation ?', $$1. La tendance générale sur ce qu'on voit que le graphique est baissière. Congestion après une descente.
2. La congestion au break to the downside. Quand on voit ça, on attend parce que c'est fort et c'est over-extended. Non seulement le prix est over-extended, mais aussi on a du volume à la base de la descente, donc on attend, c'est le pullback va durer
3. Very strong pullback. Et on peut voir qu'il y a du volume dans le développement du pullback. Donc possibilité d'avoir tout au moins deux jambes de pullback
4. Réaction des vendeurs. C'est la partie qui peut faillent tromper et créer du FOMO mais il ne faut pas oublier que les acheteurs ont du volume qui les soutient donc le prix ne va pas descendre aussi facilement. Même si on ne sais pas comment cela va se passer, le prix ne va pas descendre aussi facilement.
5. Il y a une congestion qui s'installe mais les acheteur n'ont pas encore réagi donc on attend.
6. Réaction des acheteurs. Il faut attendre que les choses se tassent. Et les choses se tassent peux dire - réaction des vendeurs et une autre tentative des acheteurs; - range avec faible volatilité; - le prix qui continue de monter mais faiblement.
7. Finalement on a le petit range puis le prix qui fini par descendre.$$, true),
('wtd-003', 'Que fais-tu dans cette situation ?', $$1. Big range developing
2. We are still in a congestion state inside a range$$, true),
('wtd-004', 'Que fais-tu dans cette situation ?', $$1. Congestion
2. Congestion break. Ce break est intense. Mais il faut remarquer qu'il n'a pas fait de plus haut comparé au précédent sommet complètement à gauche. Il faut faire attention à ces petites subtilités. Quand on a un break comme ça, il faut toujours attendre un autre attempt dans le sens du break et pour cela il faut toujours lire le retour!
3. Retour du prix après le break. Il faut évaluer ce retour. Ce retour est un peu trop puissant. Mais il ne faut pas oublier que les acheteurs sont aussi puissants et donc vont encore essayer.
4. Essaie des acheteurs mais ils sont pas allés plus haut que précédemment. Après ça, tout ce qu'on fait dans le sens de sell, passe.$$, true),
('wtd-005', 'Que fais-tu dans cette situation ?', $$1. On peut voir sur le graphique en H1 (sans voir que contexte général) que le prix descend. Mais à deux reprises on peut voir que le volume est apparu à des spots spécifiques où le prix n'est pas vraiment descendu. Je n'ai pas eu de vrais new low. Juste le prix qui se cherche dans sa descente.
2. On peut voir qu'on a eu un break in the structure qui est allé jusqu'au précédent et cela est soutenu par du volume. Après avoir eu un type de mouvement comme ça, le prix est over-extended
3. Analyse du pullback. Ici il faut attendre que la structure du prix se casse à un moment. Et on peut voir que le prix fait des plus bas, mais développe aussi une congestion. Ensuite il descend un peu trop par rapport à ce qu'il faisait. Ensuite il monte et fait un range. C'est là que tu peut entrer.$$, true),
('wtd-006', 'Que fais-tu dans cette situation ?', $$1. Grosse congestion sur M15.
2. La congestion a break to the down side. On est dans un vrai break to the down side donc le prix va probablement redescendre. Mais on attend le pullback
3. On peut voit aussi la succession des derniers responsables sell qui ont contribué au fait que le prix descende. Mais vers la fin le momentum a commencé par s'épuiser
4. Changement de structure et break to the up side de tous les petits responsables sell. En considérant la jambe haussière qui a tué plein de petit responsable sell, on peut voir qu'il y a encore de la force et que le pullback n'est pas encore termine.
Le problème avec le FOMO que ce genre de setup peut générer est que sur M5 et M1, on peut voir que le prix est déjà au niveau des EMA20 et même EMA50 et que le prix est même au niveau de petit range. Mais il faut regarder sur M15 comment le prix a été rejeté et aussi le fait que c'est toujours over-extended.$$, true),
('wtd-007', 'Que fais-tu dans cette situation ?', $$1. Première jambe d'un pullback.
2. Deuxième jambe du même pullback. La deuxième jambe est tout aussi intense que la première
3. On peut voir que c'est un séquence haussière.
4. La séquence haussière a fait un breach. Donc si il arrive même que le prix descende, il ne va pas descendre du style une autre jambe.$$, true),
('wtd-008', 'Que fais-tu dans cette situation ?', $$1. Le prix a fait un gros range
2. Il a cassé le gros range avec beaucoup de force
3. Le prix a pullback aussi avec beaucoup de force aussi. Ce qui peut facilement faire penser au faut que j'aurai une autre jambe encore.
4. Les vendeurs ont poussé fort eux aussi. Le niveau au quel le prix est venu, vu que nous avons deux forces en présence, il est fort possible d'avoir un range à ce niveau. Donc la meilleure chose à faire c'est de ne même pas regarder cela.
Mais il faut remarquer que pour les non avertis, on peut facilement vouloir prendre le buy à ce niveau précis surtout à cause du ralentissement. En supposant que nous voulons prendre le buy, il y a deux choses à prendre en compte. La force de la descente, et la présence ou non de kill. Ici la réaction des vendeurs est un peu trop forte et nous n'avons pas de kill de la séquence baissière ni du range en développement. Donc La meilleure chose à faire c'est de zapper tout simplement.$$, true),
('wtd-009', 'Que fais-tu dans cette situation ?', $$1. Range qui s'est développé
2. Break to the down side avec assez de force
3. Remonté avec autant de force que la descente
4. Réaction des vendeurs, on peut voir que la réaction est forte. Mais la deuxième jambe de la baisse est très faible, la structure a cassé et fait un range. Avec ces deux aspects, un achat est possible.
5. On peut laisser le range un peu plus se développer pour confirmer.$$, true);

-- ----------- wtd_options (3 par question) -----------
INSERT INTO wtd_options (question_id, texte, est_correcte) VALUES
-- wtd-002 (correcte = A)
('wtd-002', 'Over-extended wait for the price to slow down and evaluate', true),
('wtd-002', 'Trade is leaving, Jump on the train so you don''t miss out', false),
('wtd-002', 'Close the computer. You missed it', false),
-- wtd-003 (correcte = C)
('wtd-003', 'Take the sell, because Sellers are strong', false),
('wtd-003', 'Take the buy, because buyers are stronger', false),
('wtd-003', 'Wait for the congestion to break and evaluate', true),
-- wtd-004 (correcte = B)
('wtd-004', 'It''s a Sell. Take the sell now, you won''t have that price again', false),
('wtd-004', 'Wait for the price to pullback and see how is the pullback.', true),
('wtd-004', 'It''s a buy. Take the buy now, just go on M1 et take the buy', false),
-- wtd-005 (correcte = A)
('wtd-005', 'C''est un pullback en développement. Il faut attendre le changement de structure dans le développement du pullback.', true),
('wtd-005', 'Le prix ralentit, tu peux te positionner pour continuer la vente vue que le prix est en descente.', false),
('wtd-005', 'Ce sera un range qui va suivre, ne perd pas ton temps sur ce setup', false),
-- wtd-006 (correcte = B)
('wtd-006', 'Le pullback ralenti, il faut vendre pour rejoindre la tendance. En plus en M1, on peut voir que le prix est au niveau des EMA', false),
('wtd-006', 'Les acheteurs sont trop forts, il faut attendre, la première jambe du pullback est toujours en cours', true),
('wtd-006', 'Le prix va faire un range et redescendre. Il faut patienter un peu avant de vendre', false),
-- wtd-007 (correcte = B)
('wtd-007', 'Sell now. Tu es déjà à un bon spot sur en M15 par rapport à ta EMA20 et EMA50', false),
('wtd-007', 'Tu ne fais rien parce que la deuxième jambe va encore se produire car la première jambe est encore forte. Et même si elle se produit tu as peu de chance que la tendance reprenne parce que la hausse est persistante.', true),
('wtd-007', 'Le prix va monter maintenant. Prend le buy, tu as un bon discount donc Buy.', false),
-- wtd-008 (correcte = B)
('wtd-008', 'Tu as au SR et le prix ralenti. Ce n''est pas pour rien. Il faut anticiper le Buy.', false),
('wtd-008', 'Je fais rien, tu n''as aucune confirmation. Le mieux c''est de laisser. Cela ne vaut pas le cout de la réflexion.', true),
('wtd-008', 'Les vendeurs sont trop forts. Il faut anticiper la vente', false),
-- wtd-009 (correcte = A)
('wtd-009', 'La dernière jambe de descente est faible et le prix a cassé la structure. Attends de voit si le range persiste, puis achète si possible.', true),
('wtd-009', 'Le sell est trop fort, c''est juste un petit pullback pour continuer le sell encore plus fort. Prépare toi à vendre.', false),
('wtd-009', 'C''est trop risqué il faut oublier', false);

-- ----------- wtd_images -----------
INSERT INTO wtd_images (question_id, url_avant, url_apres, url_explication, source_info) VALUES
('wtd-002',
 'https://res.cloudinary.com/dh4cnlh03/image/upload/chart_wtd002_avant_mrmaoa.png',
 'https://res.cloudinary.com/dh4cnlh03/image/upload/chart_wtd002_apres_wfliih.png',
 'https://res.cloudinary.com/dh4cnlh03/image/upload/chart_wtd002_explication_qkwpmd.png',
 NULL),
('wtd-003',
 'https://res.cloudinary.com/dh4cnlh03/image/upload/chart_wtd003_avant_pgjc7z.png',
 'https://res.cloudinary.com/dh4cnlh03/image/upload/chart_wtd003_apres_ryznw0.png',
 'https://res.cloudinary.com/dh4cnlh03/image/upload/chart_wtd003_explication_tx8qfw.png',
 NULL),
('wtd-004',
 'https://res.cloudinary.com/dh4cnlh03/image/upload/chart_wtd004_avant_u33ky2.png',
 'https://res.cloudinary.com/dh4cnlh03/image/upload/chart_wtd004_apres_mh451e.png',
 'https://res.cloudinary.com/dh4cnlh03/image/upload/chart_wtd004_explication_e73jba.png',
 NULL),
('wtd-005',
 'https://res.cloudinary.com/dh4cnlh03/image/upload/chart_wtd005_avant_syi0s9.png',
 'https://res.cloudinary.com/dh4cnlh03/image/upload/chart_wtd005_apres_mxinzq.png',
 'https://res.cloudinary.com/dh4cnlh03/image/upload/chart_wtd005_explication_waitn3.png',
 NULL),
('wtd-006',
 'https://res.cloudinary.com/dh4cnlh03/image/upload/chart_wtd006_avant_dxf3n2.png',
 'https://res.cloudinary.com/dh4cnlh03/image/upload/chart_wtd006_apres_o2ulxl.png',
 'https://res.cloudinary.com/dh4cnlh03/image/upload/chart_wtd006_explication_z94bb2.png',
 NULL),
('wtd-007',
 'https://res.cloudinary.com/dh4cnlh03/image/upload/chart_wtd007_avant_inb5zs.png',
 'https://res.cloudinary.com/dh4cnlh03/image/upload/chart_wtd007_apres_jjk136.png',
 'https://res.cloudinary.com/dh4cnlh03/image/upload/chart_wtd007_explication_uf67cb.png',
 NULL),
('wtd-008',
 'https://res.cloudinary.com/dh4cnlh03/image/upload/chart_wtd008_avant_bxhdzb.png',
 'https://res.cloudinary.com/dh4cnlh03/image/upload/chart_wtd008_apres_vxdofi.png',
 'https://res.cloudinary.com/dh4cnlh03/image/upload/chart_wtd008_explication_zmftzz.png',
 NULL),
('wtd-009',
 'https://res.cloudinary.com/dh4cnlh03/image/upload/chart_wtd009_avant_rdb7bj.png',
 'https://res.cloudinary.com/dh4cnlh03/image/upload/chart_wtd009_apres_m6sdjv.png',
 'https://res.cloudinary.com/dh4cnlh03/image/upload/chart_wtd009_explication_az70ur.png',
 NULL);

-- ----------- Vérification -----------
SELECT q.id, q.titre,
  (SELECT COUNT(*) FROM wtd_options o WHERE o.question_id = q.id) AS nb_options,
  (SELECT COUNT(*) FROM wtd_options o WHERE o.question_id = q.id AND o.est_correcte = true) AS nb_correctes,
  (SELECT url_avant FROM wtd_images i WHERE i.question_id = q.id) AS url_avant
FROM wtd_questions q
WHERE q.id BETWEEN 'wtd-002' AND 'wtd-009'
ORDER BY q.id;
