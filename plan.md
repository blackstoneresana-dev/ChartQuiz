# plan.md — ChartQuiz

**Source de vérité unique** pour l'avancement du projet. Mis à jour à chaque session.
Dernière mise à jour : **2026-05-28 (session 14 — Supabase security hardening)**

---

## Légende
- ✅ Terminé
- ⏳ En cours / partiel
- ❌ Non commencé
- 🔒 Bloqué (dépendance externe)

---

## Phase 1 — Fondations techniques ✅

- ✅ Structure de fichiers, Supabase configuré, RLS activée
- ✅ `js/supabase.js`, `js/quiz.js`, `css/style.css`
- ✅ Refactoring qualité (quizState, CSS constants, event delegation, helper DOM)

---

## Phase 2 — Quiz Direction ✅

- ✅ q-001 à q-025 importées (Cloudinary + Supabase)
- ✅ Session 10 questions, camembert SVG, révélation `source_info` en fin
- ✅ UP / DOWN / SIDEWAYS, validation, graphiques APRÈS + EXPLICATION, enregistrement

---

## Phase 3 — Dashboard personnel ✅

- ✅ `dashboard.html` + `js/dashboard.js`
- ✅ 4 KPI cards : taux de réussite, série, total quizzes, niveau global
- ✅ Donut SVG direction (UP/DOWN/SIDEWAYS) avec stats
- ✅ Top-5 questions à retravailler — tags direction/niveau + bouton Rejouer
- ✅ Grille activité 30 jours
- ✅ Dashboard agrège les 2 formats (Direction + PA)

---

## Phase 4 — Page d'accueil ✅

- ✅ `index.html` + `js/index.js` — 2 cards de quiz, lien dashboard, auth redirect

---

## Phase 5 — Authentification ✅

- ✅ Supabase Auth (email + password), `auth.html` + `js/auth.js`
- ✅ Pseudo + logout, redirect si non connecté (déplacés dans la sidebar — session 15)

---

## Phase 6 — Nouveaux formats de quiz ⏳

### Post Analysis ✅
- ✅ Tables + schéma, RLS + grants `anon` + `authenticated`
- ✅ `post-analysis.html` + `js/post-analysis.js`
- ✅ pa-001 à pa-099 importées — `csv/pa_import_pa002_pa099.sql`
- ✅ Graphiques AVANT et APRÈS affichés côte à côte (grille 2 colonnes)
- ✅ Container élargi à 1400px pour mieux exploiter l'espace
- ✅ Décision : pas de `source_info` pour Post Analysis
- ⏳ Explications à compléter pour les questions sans texte (pa-003, pa-005, pa-007…)

---

## Phase 7 — Polish & déploiement ⏳

- ✅ Bouton expand plein écran sur tous les graphiques (`js/ui.js`)
- ✅ Design system v2 — tokens dark mode (`#050505`, crème `#E8D8B8`), couleurs sémantiques sobres, shadows cards
- ✅ Contraste bouton "Valider" en dark mode corrigé
- ✅ Responsive mobile (< 600px) — bloc global + breakpoint 380px
- ✅ Lazy loading des images graphiques (`loading="lazy"` + `decoding="async"` sur `.chart-img`)
- ✅ Déploiement Vercel — https://chart-quiz.vercel.app (repo: github.com/blackstoneresana-dev/ChartQuiz)
- ❌ Tests cross-browser (Chrome, Firefox, Safari)
- ❌ Variables d'environnement pour les clés Supabase

---

## Backlog / Idées futures

- ✅ Graphique de performance (courbe + aire) sur le dashboard — Chart.js (cumulatif 30j)

---

## Infrastructure — infos clés

### Supabase
- URL : `https://sagbsylvqxeisbqcnupb.supabase.co`
- Clé anon : `sb_publishable_H5Az5UewihranMkw_f5M4w_XZbnwO5u`
- Tables Direction : `questions`, `options`, `images`, `users`, `responses`
- Tables Post Analysis : `pa_questions`, `pa_images`, `pa_responses`
- **Opt-in nouvelle Data API** (2026-05-28) : `default privileges` du schéma `public` ne grant plus `SELECT/INSERT/UPDATE/DELETE` à `anon`/`authenticated`. **Toute nouvelle table doit inclure les `GRANT` explicites + `ENABLE RLS` + policies non permissives dans sa migration**. Voir `CLAUDE.md` section "Règle Data API" pour le template.
- Policies RLS hardenées (2026-05-28) : `users` / `responses` / `pa_responses` INSERT et SELECT restreints à `auth.uid() = id|user_id` (avant : `WITH CHECK (true)` et `USING (true)`).
- Auth hardening dashboard : min password 10, complexité full, Secure password change ON, Require current password ON. Leaked password HaveIBeenPwned = Pro plan only (non activé).

### Cloudinary
- Cloud name : `dh4cnlh03` — API Key : `785422968249697`
- Dossiers : `ChartQuiz_01/Question/q001→q025`, `PA_Quiz/pa001→pa099`
- Naming PA : `chart_pa{NNN}_{avant_1|avant_2|apres_1|apres_2}_{suffix}.png`
- Dossiers `trading-errors/` (AUDJPY, GBPJPY, NZDCHF, NZDJPY, WTICOUSD) — non importés

---

## Session 15 — 2026-07-22 (refonte sidebar)

- ✅ Sidebar — logo ChartQuiz dans `.sidebar-header` (remplace titre "Sessions"/"Navigation")
- ✅ Sidebar — rangée `.sidebar-user-row` horizontale sous le header : badge user + logout + thème (retirés de la top bar)
- ✅ Top bar réduite au hamburger seul, bordure basse `.header` supprimée
- ✅ Cache-bust CSS `?v=20260722` sur les 5 pages (fix : navigateurs servaient l'ancien style.css)
- ✅ Commit f458d07 poussé (inclut aussi le travail PA analysis de session 13)

---

## Session 12 — 2026-05-07

- ✅ Suppression complète format **What Do You Do** (commit d90eb1b) — fichiers HTML/JS/CSS/SQL purgés, sidebar/cards/tabs retirés, docs MAJ (3 → 2 formats)
- ✅ Polices petits textes +1px (tags/labels/meta 8-11px) — commit 5e20e31
- ✅ Sidebar — icônes Unicode remplacées par SVG Lucide (commit 3b1b767)
- ✅ Dashboard — tag direction retiré liste à retravailler (fuitait réponse) — commit 2909f04
- ✅ Dashboard — logique liste à retravailler + deep-link Rejouer (commit 543d15e)
- ✅ Cleanup DB Supabase — tables `wtd_questions`, `wtd_options`, `wtd_images`, `wtd_responses` droppées (`csv/wtd_cleanup.sql`)
- ✅ Suppression reveal `source_info` Direction Quiz — `.source-box`, `.sources-title`, `.source-row*` retirés (HTML/JS/CSS), CLAUDE.md MAJ
- ✅ Drop colonne `images.source_info` Supabase (`csv/source_info_cleanup.sql`)

---

## Session 10 — 2026-04-26

- ✅ Correction nomenclature Cloudinary pa037→pa042
- ✅ Import pa-002→pa-099 via API Cloudinary + CSV réponses (`pa_quiz_answers.csv`)
- ✅ `index.html` — page d'accueil avec 2 formats + dashboard teaser
- ✅ Bouton "Valider" dark mode — contraste corrigé (texte noir sur fond crème)
- ✅ Dashboard agrège Direction + PA (supabase.js + dashboard.js)
- ✅ Dashboard redesign — 4 KPI, donut SVG, tags + Rejouer, CTA Nouveau Quiz
- ✅ Design system v2 — tokens dark (`#050505`, `#E8D8B8`), couleurs sémantiques sobres, shadows
- ✅ Post Analysis — charts côte à côte, container élargi à 1400px

---

## Session 14 — 2026-05-28 (Supabase security hardening)

- ✅ MCP Supabase configuré (`supabase-chartquiz`, read-only, user-scope)
- ✅ Audit security via `get_advisors` → 4 lints identifiés
- ✅ DROP policies permissives `WITH CHECK (true)` sur `users`, `responses`, `pa_responses`
- ✅ CREATE policies strictes `WITH CHECK (auth.uid() = id|user_id)` (INSERT) + `USING (auth.uid() = user_id)` (SELECT `responses`)
- ✅ Opt-in nouvelle Data API default : `ALTER DEFAULT PRIVILEGES … REVOKE … FROM anon, authenticated`
- ✅ Dashboard auth hardening : min length 10, complexité upper/lower/digits/symbols, Secure password change ON, Require current password ON
- ✅ `CLAUDE.md` MAJ avec template migration + rappel policies
- ⚠️ Leaked password protection (HaveIBeenPwned) bloqué = Pro plan only — mitigation gratuite appliquée à la place
- ℹ️ Lint final restant : `auth_leaked_password_protection` (intentionnel, Pro plan)

---

## Session 13 — 2026-05-21

- ✅ Post Analysis — formulaire analyse structurée 5 champs avant validation (setup, context, edge, signal, execution)
- ✅ `csv/pa_analysis_columns.sql` — ALTER TABLE pa_questions (5 colonnes nullable) — **à exécuter dans Supabase**
- ✅ `csv/pa_analysis_answers.csv` — template 99 lignes vides pour migration données
- ✅ `post-analysis.html` — section `#pa-analysis-form` + section `#pa-analysis-compare`
- ✅ `css/style.css` — styles `.pa-analysis-*`, `.pa-compare-*`, responsive mobile
- ✅ `js/post-analysis.js` — `paState.analysis`, `bindAnalysisInputs()`, `updateSubmitGate()`, `paBuildCompare()`, fallback legacy
- ✅ Exécuter `csv/pa_analysis_columns.sql` dans Supabase (ALTER TABLE) — fait session 13
- ✅ Test local validé — form, gate, compare grid, match/miss tout fonctionnel
- ⏳ Remplir `csv/pa_analysis_answers.csv` + générer `csv/pa_analysis_update.sql` → **ACTION USER**
- ⏳ Explications PA — compléter `explication_texte` vides via UPDATE SQL → **ACTION USER**
- ✅ Déployer sur Vercel (commit f458d07, session 15)

## Prochaine session — À faire en priorité

### Actions utilisateur (hors code) à faire AVANT la session
1. **Remplir `csv/pa_analysis_answers.csv`** — ouvrir le fichier, renseigner les 5 colonnes (`correct_setup`, `correct_context`, `correct_edge`, `correct_signal`, `correct_execution`) pour chaque question PA. Les valeurs autorisées pour `correct_setup` : `Cheese trade LTF`, `Anticipation`, `Trend pullback classic`. Pour `correct_execution` : `Good` ou `Bad`. Laisser vide si la question n'a pas encore de bonne réponse.
2. **Remplir `explication_texte`** — identifier les questions PA sans texte d'explication (pa-003, pa-005, pa-007…) et préparer les textes.

### Ce que Claude fera en début de session suivante
1. Générer `csv/pa_analysis_update.sql` depuis le CSV rempli
2. Générer le SQL UPDATE pour les explications PA manquantes
3. Commit + push → déploiement Vercel
