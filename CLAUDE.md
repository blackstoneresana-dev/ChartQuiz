# CLAUDE.md — ChartQuiz

Fichier de contexte persistant pour Claude Code.
Lis ce fichier en entier avant d'écrire ou de modifier du code.

---

## Présentation du projet

**ChartQuiz** est un site web de quiz interactif pour traders, avec 2 formats de quiz :

1. **Direction Quiz** — le trader voit un graphique AVANT, choisit UP/DOWN/SIDEWAYS, valide, puis découvre le graphique APRÈS + EXPLICATION + analyse. À la fin de la session, les sources (paire, timeframe, date, broker) sont révélées.
2. **Post Analysis** — le trader voit 2 graphiques AVANT un trade et juge si c'était RIGHT ou WRONG, puis voit les 2 graphiques APRÈS.

Un dashboard personnel permet de suivre ses statistiques et de retravailler ses erreurs.
Un système d'authentification (Supabase Auth) gère les comptes utilisateurs.

---

## Stack technique

| Couche         | Outil         | Usage                                              |
|----------------|---------------|----------------------------------------------------|
| Base de données| Supabase      | Questions, options, images, users, responses       |
| Images         | Cloudinary    | Hébergement des 3 screenshots par question         |
| Frontend       | HTML/CSS/JS   | Pas de framework — vanilla JS uniquement           |
| Déploiement    | Vercel        | Hébergement du site statique                       |

**Aucun framework JS (pas de React, Vue, Angular).** Vanilla JS uniquement.
**Aucune dépendance npm** sauf pour les appels Supabase via leur CDN.

---

## Structure des fichiers

```
chartquiz/
├── CLAUDE.md
├── plan.md                          ← roadmap détaillée (source de vérité)
├── index.html                       ← page d'accueil (❌ non commencée)
├── quiz.html                        ← Direction Quiz (✅ FONCTIONNEL)
├── post-analysis.html               ← Post Analysis (✅ FONCTIONNEL)
├── dashboard.html                   ← Dashboard stats (✅ FONCTIONNEL)
├── auth.html                        ← Login/Signup (✅ FONCTIONNEL)
├── chartquiz_simulation.html        ← référence visuelle (ne pas modifier)
├── css/
│   └── style.css                   ← styles globaux + tokens de design
├── js/
│   ├── supabase.js                  ← client Supabase + toutes les fonctions DB
│   ├── quiz.js                      ← logique Direction Quiz
│   ├── post-analysis.js             ← logique Post Analysis
│   ├── dashboard.js                 ← logique Dashboard
│   └── auth.js                      ← logique Auth
└── csv/
    ├── QUESTIONS.csv / OPTIONS.csv / IMAGES.csv   ← Direction Quiz
    ├── import_q005_q025.sql                        ← import q-005 à q-025
    ├── PA_IMAGES.csv                               ← Post Analysis
    └── pa_schema.sql / pa_import_pa001.sql
```

---

## Base de données Supabase

### Table : `questions`
```sql
id               uuid PRIMARY KEY DEFAULT gen_random_uuid()
titre            text NOT NULL
niveau           text CHECK (niveau IN ('debutant', 'intermediaire', 'avance'))
explication_texte text
actif            boolean DEFAULT true
created_at       timestamp DEFAULT now()
```

### Table : `options`
```sql
id               uuid PRIMARY KEY DEFAULT gen_random_uuid()
question_id      uuid REFERENCES questions(id)
texte            text CHECK (texte IN ('UP', 'DOWN', 'SIDEWAYS'))
est_correcte     boolean DEFAULT false
```
— Toujours 3 lignes par question (UP / DOWN / SIDEWAYS).
— Un seul `est_correcte = true` par question.

### Table : `images`
```sql
id               uuid PRIMARY KEY DEFAULT gen_random_uuid()
question_id      uuid REFERENCES questions(id)
url_avant        text NOT NULL      -- URL Cloudinary
url_apres        text NOT NULL      -- URL Cloudinary
url_explication  text NOT NULL      -- URL Cloudinary
```

### Table : `users`
```sql
id               uuid PRIMARY KEY DEFAULT gen_random_uuid()
email            text UNIQUE NOT NULL
pseudo           text
niveau           text CHECK (niveau IN ('debutant', 'intermediaire', 'avance'))
created_at       timestamp DEFAULT now()
```

### Table : `responses`
```sql
id               uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id          uuid REFERENCES users(id)
question_id      uuid REFERENCES questions(id)
session_id       uuid               -- regroupe les réponses d'un même passage
direction        text CHECK (direction IN ('UP', 'DOWN', 'SIDEWAYS'))
est_correcte     boolean
commentaire      text CHECK (char_length(commentaire) <= 200)
created_at       timestamp DEFAULT now()
```

### Tables Post Analysis : `pa_questions`, `pa_images`, `pa_responses`
— `pa_questions` : id, titre, niveau, explication_texte, actif, created_at
— `pa_images` : id, question_id, url_avant_1, url_avant_2, url_apres_1, url_apres_2, source_info
— `pa_responses` : id, user_id, question_id, session_id, choix (RIGHT/WRONG), est_correcte, created_at

**Important Supabase** : toujours inclure `TO anon, authenticated` dans les GRANT — oublier `authenticated` = "permission denied" pour les users connectés.

---

## Design system

### Typographie
- **Display / UI** : `Syne` (Google Fonts) — weights 400, 500, 600, 700, 800
- **Monospace / Labels** : `JetBrains Mono` (Google Fonts) — weights 400, 500
- Import CDN :
```html
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### Tokens CSS — Mode jour (défaut)
```css
:root {
  --bg:      #ffffff;
  --bg2:     #f4f4f6;
  --bg3:     #ebebef;
  --border:  rgba(0,0,0,0.08);
  --border2: rgba(0,0,0,0.13);
  --text:    #0f0f18;
  --muted:   #888899;

  --accent:  #7c6aff;
  --accent2: #a594ff;

  --up:      #00c896;
  --down:    #ff4d6a;
  --side:    #ffb84d;
  --up-bg:   rgba(0,200,150,0.08);
  --down-bg: rgba(255,77,106,0.08);
  --side-bg: rgba(255,184,77,0.08);
}
```

### Tokens CSS — Mode nuit
```css
[data-theme="dark"] {
  --bg:      #0a0a0f;
  --bg2:     #111118;
  --bg3:     #18181f;
  --border:  rgba(255,255,255,0.07);
  --border2: rgba(255,255,255,0.12);
  --text:    #e8e8f0;
  --muted:   #6b6b7e;

  --accent:  #7c6aff;
  --accent2: #a594ff;

  /* --up / --down / --side restent identiques */
}
```

### Bouton mode jour/nuit
- Appliquer `data-theme="dark"` sur `<html>` pour activer le mode nuit
- Sauvegarder le choix dans `localStorage` clé `chartquiz-theme`
- Au chargement, lire `localStorage` et appliquer le thème avant le premier rendu (évite le flash)
- Le bouton se place dans le header, coin supérieur droit, à côté du badge de niveau
- Icône : ☀ (jour) / ☽ (nuit) — texte simple, pas d'image
- Transition sur `background` et `color` : `transition: background 0.25s, color 0.25s`

```js
// Initialisation thème (à placer AVANT le </head>)
(function() {
  const saved = localStorage.getItem('chartquiz-theme');
  if (saved === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
})();

// Toggle
function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
  localStorage.setItem('chartquiz-theme', isDark ? 'light' : 'dark');
  updateThemeBtn();
}

function updateThemeBtn() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.getElementById('theme-btn').textContent = isDark ? '☀' : '☽';
}
```

### Composants UI clés

#### Tag de graphique (libellé au-dessus du graphique)
```css
.chart-tag {
  display: inline-block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.08em;
  padding: 3px 10px;
  border-radius: 4px;
  font-weight: 500;
  margin-bottom: 6px;
}
.tag-avant  { background: rgba(124,106,255,0.2); color: var(--accent2); border: 1px solid rgba(124,106,255,0.3); }
.tag-apres  { background: rgba(0,200,150,0.15);  color: var(--up);      border: 1px solid rgba(0,200,150,0.3);  }
.tag-expl   { background: rgba(255,184,77,0.15); color: var(--side);    border: 1px solid rgba(255,184,77,0.3); }
```
**Important** : le `.chart-tag` est placé AVANT le `.chart-wrap` dans le DOM,
pas à l'intérieur. Ne jamais mettre `position: absolute` sur le tag.

#### Conteneur graphique
```css
.chart-wrap {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--border);
  margin-bottom: 1.75rem;
  background: #0d0d0d;   /* toujours sombre — c'est un graphique TradingView */
}
.chart-img {
  width: 100%;
  display: block;
}
```
Le fond du `.chart-wrap` reste `#0d0d0d` en mode jour ET en mode nuit
car les graphiques TradingView ont un fond noir natif.

#### Boutons de direction (UP / DOWN / SIDEWAYS)
```css
.options-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 1.25rem;
}
.opt {
  border: 1px solid var(--border2);
  border-radius: 10px;
  padding: 11px 12px;   /* réduit d'un quart vs 16px — pour voir le bouton Valider sans scroll */
  text-align: center;
  cursor: pointer;
  transition: all 0.18s;
  background: var(--bg2);
}
.opt.selected-up   { border-color: var(--up);   background: var(--up-bg);   }
.opt.selected-down { border-color: var(--down); background: var(--down-bg); }
.opt.selected-side { border-color: var(--side); background: var(--side-bg); }
.opt.correct { border-color: var(--up)   !important; background: var(--up-bg)   !important; }
.opt.wrong   { border-color: var(--down) !important; background: var(--down-bg) !important; }
/* Icône et label dans le bouton */
.opt-arrow { font-size: 20px; margin-bottom: 2px; color: var(--muted); transition: color 0.18s; }
.opt-name  { font-size: 13px; font-weight: 600; letter-spacing: 0.06em; color: var(--text); transition: color 0.18s; }
```

#### Zone de commentaire
- `maxlength="200"` sur le `<textarea>`
- Compteur de caractères en temps réel (`0 / 200`)
- Compteur passe en `color: var(--down)` à partir de 180 caractères
- Champ facultatif — ne jamais bloquer la validation si vide

#### Bandeau de résultat
```css
.result-banner.correct-banner {
  background: rgba(0,200,150,0.1);
  border: 1px solid rgba(0,200,150,0.3);
}
.result-banner.wrong-banner {
  background: rgba(255,77,106,0.1);
  border: 1px solid rgba(255,77,106,0.3);
}
```

#### Boîte d'explication
```css
.expl-box {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1.5rem;
  border-left: 3px solid var(--side);
}
.expl-list li { color: #1a1a2e; }   /* toujours sombre pour la lisibilité */
```
En mode nuit, surcharger `.expl-list li` :
```css
[data-theme="dark"] .expl-list li { color: var(--text); }
```

#### Sidebar de navigation entre sessions
```css
.sidebar-toggle {                 /* bouton hamburger, header gauche */
  display: flex; flex-direction: column; justify-content: space-between;
  width: 22px; height: 16px; cursor: pointer;
  background: none; border: none; padding: 0; margin-right: 14px;
}
.sidebar-toggle span { display: block; width: 100%; height: 2px; background: var(--muted); border-radius: 2px; }
.sidebar {
  position: fixed; top: 0; left: 0; bottom: 0; width: 270px;
  background: var(--bg2); border-right: 1px solid var(--border2);
  z-index: 101; transform: translateX(-100%);
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}
.sidebar.open { transform: translateX(0); }
.sidebar-overlay {
  display: none; position: fixed; inset: 0;
  background: rgba(0,0,0,0.45); z-index: 100; backdrop-filter: blur(2px);
}
.sidebar-overlay.visible { display: block; }
```
**Structure HTML :**
- `.sidebar-overlay` et `<aside class="sidebar">` sont placés **avant** `.container`, directement sous `<body>`
- Le bouton hamburger est le **premier enfant** du `.header`, avant `.logo`
- Le bouton thème ☽/☀ est dans un `<div style="display:flex">` avec `.level-badge`, côté droit du header

**Sessions dans le sidebar :**
- `Direction Quiz` — actif (`.active`), fond violet `rgba(124,106,255,0.12)`
- `Post Analysis` — actif (`.active`), lien vers `post-analysis.html`

#### Boîte source (révélée à la fin)
```css
.source-box {
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}
```

---

## Règles de comportement du quiz

1. **Pendant le quiz** : afficher uniquement le graphique AVANT + les 3 options + le champ commentaire.
   Ne jamais afficher la paire, le timeframe, la date ou la source.

2. **Après validation** :
   - Désactiver les 3 boutons de direction
   - Colorer le bon bouton en vert (`.correct`), le mauvais choix en rouge (`.wrong`) si applicable
   - Afficher le bandeau résultat (correct / incorrect)
   - Afficher le graphique APRÈS puis le graphique EXPLICATION (empilés verticalement, pleine largeur)
   - Afficher le texte d'analyse
   - Scroll automatique vers la section résultat

3. **À la fin du test complet** : afficher écran score (corrects/total).

4. **La bonne réponse** vient de `options` où `est_correcte = true`.
   La valeur est `'UP'`, `'DOWN'` ou `'SIDEWAYS'`.

5. **Enregistrement** : chaque réponse est insérée dans `responses` avec :
   `user_id`, `question_id`, `session_id`, `direction`, `est_correcte`, `commentaire`.

---

## Dashboard — calculs à effectuer

Toutes les stats sont calculées depuis la table `responses` filtrée par `user_id`.

| Métrique                  | Calcul                                                        |
|---------------------------|---------------------------------------------------------------|
| Taux de réussite global   | `COUNT(est_correcte=true) / COUNT(*) * 100`                  |
| Réussite par direction    | Même calcul filtré par `direction`                            |
| Réussite par niveau       | JOIN avec `questions` sur `niveau`                            |
| Questions à retravailler  | `question_id` où `est_correcte=false` groupé, trié par fréquence |
| Série en cours            | Compter les dernières `est_correcte=true` consécutives        |
| Activité (heatmap)        | `COUNT(*)` groupé par `DATE(created_at)`                      |

---

## Conventions de code

- Toujours utiliser `const` et `let`, jamais `var`
- Fonctions asynchrones avec `async/await`, pas de `.then()` chaîné
- Nommer les fonctions en camelCase : `selectOption()`, `submitAnswer()`, `loadQuestion()`
- Nommer les IDs HTML en kebab-case : `id="submit-btn"`, `id="result-section"`
- Nommer les classes CSS en kebab-case : `.chart-wrap`, `.opt-arrow`, `.result-banner`
- Tous les textes UI en français
- Les valeurs de direction toujours en majuscules : `'UP'`, `'DOWN'`, `'SIDEWAYS'`
- Les IDs de questions toujours au format : `q-001`, `q-002`…
- Ne jamais hardcoder la bonne réponse dans le JS — toujours la lire depuis Supabase

### Patterns d'architecture établis (issus du guide qualité)

**État centralisé** — toujours regrouper les variables de session dans un objet unique :
```js
const quizState = { currentQuestion: null, selected: null, submitted: false, sessionId };
```

**Constantes CSS** — jamais de magic strings pour les classes d'état :
```js
const CSS = {
  SELECTED: { UP: 'selected-up', DOWN: 'selected-down', SIDEWAYS: 'selected-side' },
  CORRECT: 'correct', WRONG: 'wrong', DISABLED: 'disabled',
};
```

**Helper DOM** — toujours utiliser `$(id)` pour accéder au DOM (warn si absent) :
```js
function $(id) {
  const el = document.getElementById(id);
  if (!el) console.warn(`[ChartQuiz] Élément #${id} introuvable`);
  return el;
}
```

**Pas de handlers inline** — jamais `onclick=` dans le HTML, toujours `addEventListener` :
```html
<!-- ✗ Interdit -->  <div onclick="selectOpt(this, 'UP')">
<!-- ✓ Correct  -->  <div data-direction="UP">
```
```js
$('options').addEventListener('click', e => { ... });
```

**Découpage des fonctions** — `submitAnswer()` orchestre, les étapes sont des fonctions séparées :
```
submitAnswer() → disableOptions() + colorizeOptions() + saveResponse() + revealResult()
```

**Gestion d'erreurs contextualisée** — toujours ajouter le contexte métier à l'erreur :
```js
if (error) throw new Error(`Question introuvable (${id}) : ${error.message}`);
```

**DRY sur les requêtes Supabase** — extraire les filtres communs en fonction utilitaire :
```js
function buildActiveQuery(niveau) { /* filtre actif + niveau */ }
```

---

## Ce qu'il ne faut jamais faire

- Ne jamais mettre `position: absolute` sur un `.chart-tag`
- Ne jamais mettre le `.chart-tag` à l'intérieur du `.chart-wrap`
- Ne jamais mettre les graphiques APRÈS et EXPLICATION côte à côte — toujours empilés
- Ne jamais utiliser de framework JS (React, Vue, etc.)
- Ne jamais bloquer la soumission si le commentaire est vide (il est facultatif)
- Ne jamais utiliser `var`

---

## Référence de la simulation HTML validée

Le fichier **`chartquiz_simulation.html`** est la référence visuelle validée (mode jour + mode nuit dans un seul fichier).
Tout nouveau composant doit être cohérent avec ce fichier en termes de :
- Typographie (Syne + JetBrains Mono)
- Couleurs (tokens CSS ci-dessus, dark/light via `data-theme`)
- Comportement du quiz (sélection → validation → révélation)
- Position des libellés AVANT / APRÈS / EXPLICATION (au-dessus du graphique, inline-block)
- Graphiques APRÈS et EXPLICATION empilés verticalement, pleine largeur
- Sidebar visible sur toutes les pages
- Bouton thème ☽/☀ dans le header, droite

---

## Types de sessions (formats de quiz)

Le sidebar liste les sessions disponibles. Chaque session est un **format de quiz distinct**.
Tous partagent le même design system et le même sidebar de navigation.

| Session | Statut | Description |
|---|---|---|
| **Direction Quiz** | ✅ Actif | Prédire UP/DOWN/SIDEWAYS — q-001 à q-025 en base |
| **Post Analysis** | ✅ Actif | Juger si un trade était RIGHT/WRONG — pa-001 en base, pa-002→pa-005 à importer |

---

## Roadmap & avancement du projet

**📍 Source de vérité unique : [`plan.md`](./plan.md)**

L'avancement des phases, le statut des tâches et les prochaines priorités sont **exclusivement** maintenus dans `plan.md`.
Ne pas dupliquer ces informations ici ni dans la mémoire — toujours lire `plan.md` pour connaître l'état du projet.
