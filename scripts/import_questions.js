#!/usr/bin/env node
/**
 * import_questions.js — Génère SQL d'import Direction Quiz
 *
 * Usage:
 *   node scripts/import_questions.js csv/new_questions.csv > csv/import_qNNN.sql
 *
 * CSV header attendu:
 *   id,titre,niveau,explication_texte,bonne_reponse
 *
 * Pour chaque ligne, le script :
 *   1. Interroge Cloudinary Admin API (folder ChartQuiz_01/Question/{idSansTiret})
 *   2. Récupère les 3 URLs (avant / apres / explication) via match du public_id
 *   3. Émet INSERT INTO questions / options / images
 *
 * Prérequis : .env avec CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 */

const fs    = require('fs');
const https = require('https');
const path  = require('path');

// ── ENV ────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) throw new Error('.env introuvable');
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) process.env[m[1]] = m[2];
  }
}
loadEnv();

const { CLOUDINARY_CLOUD_NAME: CLOUD, CLOUDINARY_API_KEY: KEY, CLOUDINARY_API_SECRET: SECRET } = process.env;
if (!CLOUD || !KEY || !SECRET) throw new Error('Variables Cloudinary manquantes');

// ── CSV PARSER (gère multi-ligne entre guillemets) ─────────────
function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (c === '\r') { /* skip */ }
      else field += c;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(f => f.trim() !== ''));
}

// ── CLOUDINARY API ─────────────────────────────────────────────
function fetchFolder(folder) {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${KEY}:${SECRET}`).toString('base64');
    const url  = `/v1_1/${CLOUD}/resources/by_asset_folder?asset_folder=${encodeURIComponent(folder)}&max_results=50`;
    https.get({ hostname: 'api.cloudinary.com', path: url, headers: { Authorization: `Basic ${auth}` } }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) reject(new Error(json.error.message));
          else resolve(json.resources || []);
        } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function pickUrl(resources, kind) {
  const r = resources.find(x => x.public_id.includes(`_${kind}_`));
  if (!r) throw new Error(`Ressource '${kind}' introuvable`);
  return r.secure_url;
}

// ── SQL ESCAPE ─────────────────────────────────────────────────
const esc = s => `'${String(s).replace(/'/g, "''")}'`;

// ── MAIN ───────────────────────────────────────────────────────
async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) { console.error('Usage: node scripts/import_questions.js <csv>'); process.exit(1); }

  const rows    = parseCSV(fs.readFileSync(csvPath, 'utf8'));
  const header  = rows[0].map(h => h.trim());
  const idx = name => {
    const i = header.indexOf(name);
    if (i === -1) throw new Error(`Colonne '${name}' manquante`);
    return i;
  };
  const I = {
    id: idx('id'), titre: idx('titre'), niveau: idx('niveau'),
    expl: idx('explication_texte'), reponse: idx('bonne_reponse'),
  };

  const data = [];
  for (const row of rows.slice(1)) {
    const id      = row[I.id].trim();
    const folder  = `ChartQuiz_01/Question/${id.replace('-', '')}`;
    process.stderr.write(`→ ${id} : fetch ${folder}... `);
    const resources = await fetchFolder(folder);
    const urls = {
      avant:       pickUrl(resources, 'avant'),
      apres:       pickUrl(resources, 'apres'),
      explication: pickUrl(resources, 'explication'),
    };
    process.stderr.write(`OK\n`);
    data.push({
      id, titre: row[I.titre], niveau: row[I.niveau],
      expl: row[I.expl], reponse: row[I.reponse].trim().toUpperCase(), urls,
    });
  }

  // ── SQL output ──
  const out = [];
  out.push(`-- Import Direction Quiz — généré ${new Date().toISOString().slice(0, 10)}\n`);

  out.push('-- ÉTAPE 1 — questions');
  out.push('INSERT INTO questions (id, titre, niveau, explication_texte, actif) VALUES');
  out.push(data.map(d => `  (${esc(d.id)}, ${esc(d.titre)}, ${esc(d.niveau)}, ${esc(d.expl)}, true)`).join(',\n') + ';\n');

  out.push('-- ÉTAPE 2 — options');
  out.push('INSERT INTO options (question_id, texte, est_correcte) VALUES');
  const optLines = [];
  for (const d of data) {
    for (const t of ['UP', 'DOWN', 'SIDEWAYS']) {
      optLines.push(`  (${esc(d.id)}, ${esc(t)}, ${d.reponse === t ? 'true' : 'false'})`);
    }
  }
  out.push(optLines.join(',\n') + ';\n');

  out.push('-- ÉTAPE 3 — images');
  out.push('INSERT INTO images (question_id, url_avant, url_apres, url_explication) VALUES');
  out.push(data.map(d => `  (${esc(d.id)}, ${esc(d.urls.avant)}, ${esc(d.urls.apres)}, ${esc(d.urls.explication)})`).join(',\n') + ';');

  console.log(out.join('\n'));
  process.stderr.write(`\n✓ ${data.length} question(s) générée(s)\n`);
}

main().catch(e => { console.error('ERREUR:', e.message); process.exit(1); });
