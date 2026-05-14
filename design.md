# Design System — ChartQuiz

Référence portable des choix de design : tokens, typographie, composants, animations, responsive.
Aucun framework requis — vanilla HTML/CSS. Compatible avec n'importe quel projet web.

---

## 1. Typographie

**Polices Google Fonts** (CDN) :

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

| Usage | Famille | Poids utilisés |
|---|---|---|
| Display / UI / corps | `Syne, sans-serif` | 400, 500, 600, 700, 800 |
| Labels / monospace / méta | `'JetBrains Mono', monospace` | 400, 500 |

**Règle** : `Syne` pour tout texte normal et titres. `JetBrains Mono` pour libellés techniques, labels ALL CAPS, compteurs, badges, IDs, méta (uppercase + letter-spacing 0.06–0.12em).

---

## 2. Tokens couleur (CSS variables)

### Mode jour (défaut, sur `:root`)

```css
:root {
  --bg:      #ffffff;
  --bg2:     #f4f4f6;
  --bg3:     #ebebef;
  --border:  rgba(0,0,0,0.08);
  --border2: rgba(0,0,0,0.13);
  --text:    #0f0f18;
  --muted:   #888899;

  --accent:  #7a7060;   /* taupe / café */
  --accent2: #958c80;

  --up:      #00c896;   /* vert sémantique */
  --down:    #ff4d6a;   /* rouge sémantique */
  --side:    #ffb84d;   /* orange sémantique */
  --up-bg:   rgba(0,200,150,0.08);
  --down-bg: rgba(255,77,106,0.08);
  --side-bg: rgba(255,184,77,0.08);
}
```

### Mode nuit (`[data-theme="dark"]` sur `<html>`)

```css
[data-theme="dark"] {
  --bg:      #050505;
  --bg2:     #0b0b0b;
  --bg3:     #101010;
  --border:  rgba(255,255,255,0.05);
  --border2: rgba(255,255,255,0.09);
  --text:    #f4f0e8;
  --muted:   #8d877d;

  --accent:  #e8d8b8;   /* crème */
  --accent2: #f3e7d1;

  --up:      #6e8f6a;   /* sémantique sobre dark */
  --down:    #a35c5c;
  --side:    #c6a86a;
  --up-bg:   rgba(110,143,106,0.12);
  --down-bg: rgba(163,92,92,0.12);
  --side-bg: rgba(198,168,106,0.12);
}
```

**Règles palette** :
- Fond stratifié 3 niveaux : `--bg` → `--bg2` (cards) → `--bg3` (insets/tracks).
- Bordures en alpha : `--border` (subtil), `--border2` (visible).
- Sémantique cohérente : `up` = vert, `down` = rouge, `side` = orange.
- Accent dark = crème → boutons primaires en dark : texte `#050505`.

---

## 3. Bootstrap CSS de base

```css
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: var(--bg);
  color: var(--text);
  font-family: 'Syne', sans-serif;
  min-height: 100vh;
  overflow-x: hidden;
  transition: background 0.25s, color 0.25s;
}
```

### Texture noise globale (signature visuelle)

```css
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 0;
  opacity: 0.4;
}
```

### Container

```css
.container        { max-width: 900px;  margin: 0 auto; padding: 2rem 1.5rem 4rem; position: relative; z-index: 1; }
.container--wide  { max-width: 1400px; }
```

---

## 4. Toggle thème jour/nuit

Init AVANT premier rendu (évite flash) :

```html
<script>
  (function() {
    const saved = localStorage.getItem('app-theme');
    if (saved === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  })();
</script>
```

```js
function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
  localStorage.setItem('app-theme', isDark ? 'light' : 'dark');
}
```

Bouton (icônes texte simples — pas d'image) :

```css
.theme-btn {
  background: none;
  border: 1px solid var(--border2);
  border-radius: 20px;
  padding: 4px 10px;
  font-size: 14px;
  cursor: pointer;
  color: var(--muted);
  transition: color 0.18s, border-color 0.18s, background 0.18s;
  line-height: 1;
}
.theme-btn:hover { color: var(--text); border-color: var(--accent); background: rgba(122,112,96,0.08); }
[data-theme="dark"] .theme-btn:hover { background: rgba(237,232,223,0.08); }
```

Texte : `☽` (mode jour actif) / `☀` (mode nuit actif).

---

## 5. Header

```css
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--border);
}
.logo {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text);
}
.logo span { color: var(--accent2); }

.level-badge {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  padding: 4px 12px;
  border: 1px solid var(--border2);
  border-radius: 20px;
  color: var(--muted);
  letter-spacing: 0.05em;
}
```

---

## 6. Boutons

### Primaire (plein, full-width)

```css
.submit-btn {
  width: 100%;
  padding: 14px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-family: 'Syne', sans-serif;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.18s;
  position: relative;
  overflow: hidden;
}
.submit-btn:hover    { background: var(--accent2); transform: translateY(-1px); }
.submit-btn:active   { transform: translateY(0); }
.submit-btn:disabled { background: var(--bg3); color: var(--muted); cursor: default; transform: none; }

[data-theme="dark"] .submit-btn:not(:disabled) { color: #050505; }
```

### Secondaire (outline)

```css
.next-btn {
  width: 100%;
  padding: 14px;
  background: transparent;
  color: var(--accent);
  border: 2px solid var(--accent);
  border-radius: 10px;
  font-family: 'Syne', sans-serif;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.18s;
}
.next-btn:hover { background: var(--accent); color: #fff; transform: translateY(-1px); }

[data-theme="dark"] .next-btn       { color: var(--accent2); border-color: var(--accent2); }
[data-theme="dark"] .next-btn:hover { background: var(--accent2); color: #050505; }
```

### CTA pleine largeur (variante box-shadow)

```css
.cta {
  display: block;
  width: 100%;
  padding: 15px;
  background: var(--accent);
  color: #050505;
  border: none;
  border-radius: 12px;
  font-family: 'Syne', sans-serif;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.22s;
}
.cta:hover { background: var(--accent2); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.2); }
```

### Petit bouton ghost

```css
.ghost-btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 6px 12px;
  border: 1px solid var(--border2);
  border-radius: 8px;
  background: transparent;
  color: var(--muted);
  font-family: 'Syne', sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: all 0.18s;
}
.ghost-btn:hover { background: var(--bg3); border-color: var(--accent); color: var(--accent); }
```

---

## 7. Inputs

### Textarea + compteur

```css
.input-wrap textarea, .input-wrap input {
  width: 100%;
  background: var(--bg2);
  border: 1px solid var(--border2);
  border-radius: 10px;
  padding: 12px 14px;
  color: var(--text);
  font-family: 'Syne', sans-serif;
  font-size: 13px;
  resize: none;
  line-height: 1.6;
  transition: border-color 0.18s;
  outline: none;
}
.input-wrap textarea:focus { border-color: var(--accent); }
.input-wrap textarea::placeholder { color: var(--muted); }

.char-count {
  text-align: right;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--muted);
  margin-top: 5px;
  transition: color 0.18s;
}
.char-count.warn { color: var(--down); }
```

### Form auth (label + input)

```css
.field { margin-bottom: 1.1rem; }
.label {
  display: block;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.08em;
  color: var(--muted);
  margin-bottom: 6px;
  font-family: 'JetBrains Mono', monospace;
  text-transform: uppercase;
}
.input {
  width: 100%;
  padding: 10px 14px;
  background: var(--bg);
  border: 1px solid var(--border2);
  border-radius: 8px;
  color: var(--text);
  font-family: 'Syne', sans-serif;
  font-size: 14px;
  transition: border-color 0.18s;
  outline: none;
}
.input:focus { border-color: var(--accent); }
```

---

## 8. Cards

```css
.card {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
}
.card--lg     { border-radius: 14px; padding: 1.5rem 2rem; }
.card--accent { border-left: 3px solid var(--side); }

[data-theme="dark"] .card { box-shadow: 0 8px 30px rgba(0,0,0,0.4); }
```

### Card stat (gros chiffre)

```css
.stat-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.1em;
  color: var(--muted);
  text-transform: uppercase;
  margin-bottom: 0.75rem;
}
.stat-num {
  font-size: 48px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.02em;
  color: var(--text);
}
.stat-num.accent { color: var(--accent2); }
.stat-detail {
  font-size: 12px;
  color: var(--muted);
  margin-top: 6px;
  font-family: 'JetBrains Mono', monospace;
}
```

### Mini-card (avec border-top sémantique)

```css
.mini-card {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-top: 2px solid transparent;
  border-radius: 10px;
  padding: 1rem;
  text-align: center;
}
.mini-card.dir-up   { border-top-color: var(--up);   }
.mini-card.dir-down { border-top-color: var(--down); }
.mini-card.dir-side { border-top-color: var(--side); }
```

---

## 9. Tags / Badges

```css
.tag {
  display: inline-block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.08em;
  padding: 3px 10px;
  border-radius: 4px;
  font-weight: 500;
}
.tag-accent { background: rgba(122,112,96,0.15); color: var(--accent2); border: 1px solid rgba(122,112,96,0.25); }
.tag-up     { background: rgba(0,200,150,0.15);  color: var(--up);      border: 1px solid rgba(0,200,150,0.3);  }
.tag-side   { background: rgba(255,184,77,0.15); color: var(--side);    border: 1px solid rgba(255,184,77,0.3); }
.tag-down   { background: rgba(255,77,106,0.15); color: var(--down);    border: 1px solid rgba(255,77,106,0.3); }

[data-theme="dark"] .tag-accent { background: rgba(237,232,223,0.08); border-color: rgba(237,232,223,0.18); }
```

### Badge pilule

```css
.pill {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.06em;
  padding: 2px 7px;
  border-radius: 20px;
  background: var(--bg3);
  color: var(--muted);
  border: 1px solid var(--border2);
}
```

---

## 10. Bandeaux résultat (correct / wrong)

```css
.banner {
  border-radius: 10px;
  padding: 14px 18px;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 12px;
}
.banner.success { background: rgba(0,200,150,0.1);  border: 1px solid rgba(0,200,150,0.3); }
.banner.error   { background: rgba(255,77,106,0.1); border: 1px solid rgba(255,77,106,0.3); }

.banner-title { font-size: 15px; font-weight: 700; }
.banner.success .banner-title { color: var(--up); }
.banner.error   .banner-title { color: var(--down); }
.banner-sub { font-size: 12px; color: var(--muted); margin-top: 2px; font-family: 'JetBrains Mono', monospace; }

[data-theme="dark"] .banner.success { background: rgba(110,143,106,0.12); border-color: rgba(110,143,106,0.3); }
[data-theme="dark"] .banner.error   { background: rgba(163,92,92,0.12);   border-color: rgba(163,92,92,0.3); }
```

---

## 11. Sidebar coulissante

```css
.sidebar-toggle {
  display: flex; flex-direction: column; justify-content: space-between;
  width: 22px; height: 16px; cursor: pointer;
  background: none; border: none; padding: 0; margin-right: 14px;
}
.sidebar-toggle span {
  display: block; width: 100%; height: 2px;
  background: var(--muted); border-radius: 2px;
  transition: background 0.18s;
}
.sidebar-toggle:hover span { background: var(--text); }

.sidebar-overlay {
  display: none; position: fixed; inset: 0;
  background: rgba(0,0,0,0.45); z-index: 100;
  backdrop-filter: blur(2px);
}
.sidebar-overlay.visible { display: block; animation: fadeIn 0.2s ease; }

.sidebar {
  position: fixed; top: 0; left: 0; bottom: 0;
  width: 270px;
  background: var(--bg2);
  border-right: 1px solid var(--border2);
  z-index: 101;
  transform: translateX(-100%);
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex; flex-direction: column;
  overflow-y: auto;
}
.sidebar.open { transform: translateX(0); }

.sidebar-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: 8px;
  cursor: pointer; text-decoration: none;
  transition: background 0.15s;
  color: var(--text);
  border: 1px solid transparent;
}
.sidebar-item:hover  { background: var(--bg3); }
.sidebar-item.active { background: rgba(122,112,96,0.12); border-color: rgba(122,112,96,0.2); }

[data-theme="dark"] .sidebar-item.active { background: rgba(237,232,223,0.08); border-color: rgba(237,232,223,0.15); }
```

Mobile : `width: 85vw; max-width: 300px;`

---

## 12. Tabs (segment control)

```css
.tabs {
  display: flex;
  gap: 4px;
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 4px;
  margin-bottom: 1.5rem;
}
.tab {
  flex: 1;
  padding: 8px 10px;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: var(--muted);
  font-family: 'Syne', sans-serif;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.18s, color 0.18s;
}
.tab.active {
  background: var(--bg);
  color: var(--text);
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}
```

---

## 13. Overlay plein écran (modal image)

```css
.overlay {
  display: none;
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.92);
  z-index: 300;
  align-items: center; justify-content: center;
  backdrop-filter: blur(6px);
  cursor: zoom-out;
}
.overlay.open { display: flex; }
.overlay img {
  max-width: 95vw; max-height: 90vh;
  border-radius: 10px;
  box-shadow: 0 8px 48px rgba(0,0,0,0.6);
}
```

---

## 14. Animations

```css
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

.fade-in { animation: fadeIn 0.2s ease; }
.fade-up { animation: fadeUp 0.5s ease forwards; }
```

**Règles transitions** :
- Hover/state : `transition: all 0.18s` (boutons, options, items).
- Sidebar/transform lourde : `0.28s cubic-bezier(0.4, 0, 0.2, 1)`.
- Theme switch : `transition: background 0.25s, color 0.25s` sur `body`.
- Focus input : `transition: border-color 0.18s`.

---

## 15. Échelle d'espacement

Pas de système strict — valeurs récurrentes utilisées :

| Usage | Valeur |
|---|---|
| Gap petit (grids serrés) | `4–8px` |
| Gap moyen (cards) | `10–14px` |
| Gap section | `1.25–1.75rem` (20–28px) |
| Gap large (entre blocs) | `2rem` (32px) |
| Padding card | `1rem` à `1.5rem 2rem` |
| Padding container | `2rem 1.5rem 4rem` (desktop) — `1.25rem 1rem 3rem` (mobile) |

---

## 16. Échelle typo

| Élément | Taille | Poids | Famille |
|---|---|---|---|
| Score / hero num | `48–56px` | 800 | Syne |
| Stat num | `28–32px` | 800 | Syne |
| Page title | `20px` | 800 | Syne |
| Sub-num / mini | `17–22px` | 800 | Syne |
| Logo | `15px` | 700 | Syne (uppercase, ls 0.12em) |
| Question / titre carte | `15px` | 600–700 | Syne |
| Body / corps | `13–14px` | 400–600 | Syne |
| Label uppercase | `10–11px` | 500 | JetBrains Mono (ls 0.06–0.12em) |
| Méta / counter | `10–12px` | 400 | JetBrains Mono |
| Section label | `9–10px` | 500 | JetBrains Mono (ls 0.1–0.12em, uppercase) |

**Letter-spacing** :
- Gros chiffres : `-0.02em` (resserré)
- Texte normal : défaut
- Uppercase labels : `0.06em` à `0.12em`

---

## 17. Border-radius

| Usage | Valeur |
|---|---|
| Petits tags / pills | `4px` |
| Liens / pill arrondi | `20px` |
| Inputs / boutons / sidebar items | `8–10px` |
| Cards | `10–12px` |
| Cards larges | `14–16px` |

---

## 18. Responsive breakpoints

```css
@media (max-width: 700px) { /* tablette : grids 4 → 2 cols */ }
@media (max-width: 600px) { /* mobile : grids → 1 col, container padding réduit */ }
@media (max-width: 500px) { /* mobile petit */ }
@media (max-width: 440px) { /* phone : kpi → 1 col */ }
@media (max-width: 380px) { /* phone étroit */ }
```

Pattern global mobile (≤600px) :
- `.container` padding `1.25rem 1rem 3rem`
- Logo `13px`, gros chiffres `32px`
- `.sidebar` `width: 85vw; max-width: 300px`

---

## 19. Conventions de nommage

- IDs HTML : `kebab-case` → `submit-btn`, `result-section`
- Classes CSS : `kebab-case` → `.chart-wrap`, `.stat-card`, `.mini-card.dir-up`
- Modifiers : suffixe direct (`.btn-primary`, `.card--lg`) ou état (`.active`, `.disabled`, `.visible`, `.open`, `.warn`)
- État sémantique : `.correct` / `.wrong` / `.success` / `.error`

---

## 20. Règles générales (à respecter)

- Toujours utiliser les tokens CSS variables — jamais de couleur hardcodée hors tokens.
- Toujours déclarer la transition `background 0.25s, color 0.25s` sur `body` pour le theme switch.
- Init `data-theme` AVANT `</head>` (script inline) pour éviter le flash blanc.
- Boutons primaires en dark : forcer `color: #050505` (texte sombre sur accent crème).
- Cards en dark : `box-shadow: 0 8px 30px rgba(0,0,0,0.4)` pour les détacher du fond.
- Hover boutons : `translateY(-1px)` ou `-2px` (CTA).
- Letter-spacing négatif (-0.02em) sur les gros chiffres uniquement.
- Texture noise globale via `body::before` (signature visuelle).
