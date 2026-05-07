# plan.md — ChartQuiz

**Source de vérité unique** pour l'avancement du projet. Mis à jour à chaque session.
Dernière mise à jour : **2026-05-07 (session 12)**

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
- ✅ Pseudo dans le header, logout, redirect si non connecté

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
- ⚠️ Toujours inclure `TO anon, authenticated` dans les GRANT

### Cloudinary
- Cloud name : `dh4cnlh03` — API Key : `785422968249697`
- Dossiers : `ChartQuiz_01/Question/q001→q025`, `PA_Quiz/pa001→pa099`
- Naming PA : `chart_pa{NNN}_{avant_1|avant_2|apres_1|apres_2}_{suffix}.png`
- Dossiers `trading-errors/` (AUDJPY, GBPJPY, NZDCHF, NZDJPY, WTICOUSD) — non importés

---

## Session 12 — 2026-05-07

- ✅ Suppression complète format **What Do You Do** (commit d90eb1b) — fichiers HTML/JS/CSS/SQL purgés, sidebar/cards/tabs retirés, docs MAJ (3 → 2 formats)
- ✅ Polices petits textes +1px (tags/labels/meta 8-11px) — commit 5e20e31
- ✅ Sidebar — icônes Unicode remplacées par SVG Lucide (commit 3b1b767)
- ✅ Dashboard — tag direction retiré liste à retravailler (fuitait réponse) — commit 2909f04
- ✅ Dashboard — logique liste à retravailler + deep-link Rejouer (commit 543d15e)
- ✅ Cleanup DB Supabase — tables `wtd_questions`, `wtd_options`, `wtd_images`, `wtd_responses` droppées (`csv/wtd_cleanup.sql`)

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

## Prochaine session — À faire en priorité

1. ✅ **Bug session PA** — sessionSize 5→10 corrigé, texte camembert aligné.
2. ✅ **Expand graphique au clic image** — clic sur image remplace icône, cursor zoom-in, boutons supprimés.
3. ✅ **Dashboard séparé par quiz** — tabs Tous/Direction/PA, KPI + erreurs par quiz, heatmap globale.
4. **Explications PA** — compléter `explication_texte` vides via UPDATE SQL
