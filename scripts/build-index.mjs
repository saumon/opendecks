// Génère index.html à la racine à partir des fichiers .html de decks/.
// Usage : node scripts/build-index.mjs
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const decksDir = join(root, 'decks');

const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

// Date du dernier commit touchant le fichier ; repli sur la date de modification.
function lastUpdate(file) {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cI', '--', file], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (out) return new Date(out);
  } catch {}
  return statSync(join(root, file)).mtime;
}

const decks = readdirSync(decksDir)
  .filter((f) => f.toLowerCase().endsWith('.html'))
  .map((f) => {
    const html = readFileSync(join(decksDir, f), 'utf8');
    const title = html.match(/<title>([^<]*)<\/title>/i)?.[1].trim();
    const desc = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i)?.[1].trim();
    const path = `decks/${f}`;
    return {
      title: title ? decode(title) : f.replace(/\.html$/i, ''),
      desc: desc ? decode(desc) : '',
      href: path.split('/').map(encodeURIComponent).join('/'),
      date: lastUpdate(path),
    };
  })
  .sort((a, b) => b.date - a.date || a.title.localeCompare(b.title));

const fmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });
const cards = decks.map((d) => `    <li><a href="${esc(d.href)}">
      <h2>${esc(d.title)}</h2>${d.desc ? `\n      <p>${esc(d.desc)}</p>` : ''}
      <time datetime="${d.date.toISOString().slice(0, 10)}">${fmt.format(d.date)}</time>
    </a></li>`).join('\n');

const page = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>OpenDecks</title>
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<!-- Fichier généré par scripts/build-index.mjs — ne pas éditer à la main. -->
<style>
  :root { --bg: #fafaf9; --fg: #1c1917; --muted: #78716c; --card: #fff; --line: #e7e5e4; --accent: #2563eb; }
  @media (prefers-color-scheme: dark) {
    :root { --bg: #0c0a09; --fg: #fafaf9; --muted: #a8a29e; --card: #1c1917; --line: #292524; --accent: #60a5fa; }
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--fg); font: 16px/1.5 system-ui, sans-serif; }
  main { max-width: 960px; margin: 0 auto; padding: 48px 16px; }
  h1 { font-size: 2rem; margin: 0 0 4px; }
  .sub { color: var(--muted); margin: 0 0 32px; }
  ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
  a { display: block; height: 100%; padding: 20px; background: var(--card); border: 1px solid var(--line); border-radius: 12px; color: inherit; text-decoration: none; transition: border-color .15s, transform .15s; }
  a:hover, a:focus-visible { border-color: var(--accent); transform: translateY(-2px); outline: none; }
  h2 { font-size: 1.1rem; margin: 0 0 8px; }
  p { margin: 0 0 12px; color: var(--muted); font-size: .95rem; }
  time { color: var(--muted); font-size: .85rem; }
  .empty { color: var(--muted); }
</style>
</head>
<body>
<main>
  <h1>OpenDecks</h1>
  <p class="sub">${decks.length} deck${decks.length > 1 ? 's' : ''}</p>
${decks.length ? `  <ul>\n${cards}\n  </ul>` : '  <p class="empty">Aucun deck pour le moment.</p>'}
</main>
</body>
</html>
`;

writeFileSync(join(root, 'index.html'), page);
console.log(`index.html généré (${decks.length} deck${decks.length > 1 ? 's' : ''})`);
