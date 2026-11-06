#!/usr/bin/env node
// Vérifie un deck en navigateur headless : débordements, navigation clavier, mobile, impression.
// Usage : node .claude/skills/saumon-new-deck/check-deck.cjs decks/<nom>.html
// Code de sortie 0 = tout est OK, 1 = au moins un problème (détails sur stdout).
const fs = require('fs'), os = require('os'), path = require('path'), http = require('http');

function loadPlaywright() {
  // Candidats : paquet résolvable, puis paquets du cache npx. On garde celui dont le Chromium est installé.
  const cands = ['playwright'];
  const base = path.join(os.homedir(), '.npm', '_npx');
  for (const d of fs.existsSync(base) ? fs.readdirSync(base) : []) cands.push(path.join(base, d, 'node_modules', 'playwright'));
  for (const c of cands) {
    try {
      const pw = require(c);
      if (fs.existsSync(pw.chromium.executablePath())) return pw;
    } catch {}
  }
  console.error('Playwright + Chromium introuvables. Installer : npx -y playwright install chromium');
  process.exit(2);
}

const file = process.argv[2];
if (!file || !fs.existsSync(file)) { console.error('Usage : check-deck.cjs decks/<nom>.html'); process.exit(2); }
const html = fs.readFileSync(file);
const server = http.createServer((q, r) => { r.setHeader('content-type', 'text/html; charset=utf-8'); r.end(html); });

// Exécuté dans la page. Le contenu utile s'arrête à y=930 (1080 - 150 de padding bas).
const overflow = () => {
  const out = [];
  [...document.querySelectorAll('.slide')].forEach((s, i) => {
    const id = 'slide ' + (i + 1);
    const tag = (e) => '<' + e.tagName.toLowerCase() + (e.className ? ' class="' + e.className + '"' : '') + '>';
    [...s.children].filter((c) => !c.classList.contains('status')).forEach((c) => {
      if (c.offsetTop + c.offsetHeight > 930) out.push(id + ': ' + tag(c) + ' finit à y=' + (c.offsetTop + c.offsetHeight) + ' (> 930)');
    });
    s.querySelectorAll('.card, .col, .row, .grid2, pre, ul').forEach((e) => {
      if (e.closest('.status')) return;
      if (e.scrollHeight > e.clientHeight + 2) out.push(id + ': ' + tag(e) + ' contenu plus haut que sa boîte (' + e.scrollHeight + ' > ' + e.clientHeight + ')');
      if (e.scrollWidth > e.clientWidth + 2) out.push(id + ': ' + tag(e) + ' contenu plus large que sa boîte (' + e.scrollWidth + ' > ' + e.clientWidth + ')');
    });
  });
  return out;
};

(async () => {
  const { chromium } = loadPlaywright();
  await new Promise((ok) => server.listen(0, ok));
  const url = 'http://localhost:' + server.address().port + '/';
  const browser = await chromium.launch();
  const problems = [];
  const bad = (m) => problems.push(m);

  // 1. bureau 1920×1080
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(url);
  await page.waitForTimeout(500);
  const n = await page.evaluate(() => document.querySelectorAll('.slide').length);
  (await page.evaluate(overflow)).slice(0, 40).forEach(bad);

  // navigation clavier
  const cur = async () => page.evaluate(() => [...document.querySelectorAll('.slide')].findIndex((s) => s.classList.contains('on')) + 1);
  if (await cur() !== 1) bad('navigation : la slide 1 n\'est pas active au chargement');
  await page.keyboard.press('ArrowRight'); if (await cur() !== 2) bad('navigation : ArrowRight');
  await page.keyboard.press('Space'); if (await cur() !== 3) bad('navigation : Space');
  await page.keyboard.press('ArrowLeft'); if (await cur() !== 2) bad('navigation : ArrowLeft');
  await page.keyboard.press('End'); if (await cur() !== n) bad('navigation : End');
  await page.keyboard.press('Home'); if (await cur() !== 1) bad('navigation : Home');
  await page.goto(url + '#3'); await page.waitForTimeout(200);
  if (await cur() !== 3) bad('navigation : ancre #3 ignorée');
  if (errors.length) bad('erreurs JS/console : ' + errors.join(' | '));

  // barre de statut présente sur chaque slide
  const bars = await page.evaluate(() => document.querySelectorAll('.slide > .status').length);
  if (bars !== n) bad('barre de statut : ' + bars + '/' + n + ' slides');

  // ressources externes (hors Google Fonts)
  const ext = await page.evaluate(() => [...document.querySelectorAll('[src],[href]')].map((e) => e.getAttribute('src') || e.getAttribute('href')).filter((u) => /^(https?:)?\/\//.test(u) && !/fonts\.(googleapis|gstatic)\.com/.test(u)));
  if (ext.length) bad('ressources externes interdites : ' + ext.join(', '));

  // 2. mobile 390px : pas de défilement horizontal
  const m = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await m.goto(url); await m.waitForTimeout(500);
  const sw = await m.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (sw > 1) bad('mobile 390px : défilement horizontal de ' + sw + 'px');

  // 3. impression : une page par slide (saut de page après chaque slide, hauteur 1080)
  await page.emulateMedia({ media: 'print' });
  const pr = await page.evaluate(() => [...document.querySelectorAll('.slide')].filter((s) => {
    const cs = getComputedStyle(s);
    return !(['page', 'always'].includes(cs.breakAfter) || ['page', 'always'].includes(cs.pageBreakAfter)) || cs.position === 'absolute' || s.offsetHeight !== 1080;
  }).length);
  if (pr) bad('impression : ' + pr + ' slide(s) sans saut de page propre en mode print');

  await browser.close(); server.close();
  console.log(problems.length ? 'PROBLÈMES (' + problems.length + ') :\n- ' + problems.join('\n- ') : 'OK : ' + n + ' slides, navigation, mobile et impression conformes.');
  process.exit(problems.length ? 1 : 0);
})();
