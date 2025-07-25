const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
const publicDir = path.join(__dirname, 'public');
const baseUrl = process.env.SITEMAP_BASE_URL || 'https://morfemalibreria.com.ar';

const exclude = new Set(['404.html', 'navbar.html', 'gtm.html']);

const pages = [];

function walk(sub) {
  const abs = path.join(distDir, sub);
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = path.join(sub, entry.name);
    if (entry.isDirectory()) {
      walk(rel);
    } else if (entry.name.endsWith('.html') && !exclude.has(entry.name)) {
      pages.push(rel.replace(/\\/g, '/'));
    }
  }
}

walk('');

// Make sure index.html appears first for nicer ordering
pages.sort((a, b) => {
  if (a === 'index.html') return -1;
  if (b === 'index.html') return 1;
  return a.localeCompare(b);
});

const urls = pages.map((file) => {
  if (file === 'index.html') {
    return `${baseUrl}/`;
  }
  if (file.endsWith('/index.html')) {
    const dir = file.slice(0, -'index.html'.length);
    return `${baseUrl}/${dir}`;
  }
  return `${baseUrl}/${file}`;
});

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
  .map((u) => `  <url><loc>${u}</loc></url>`)
  .join('\n')}\n</urlset>\n`;

fs.writeFileSync(path.join(distDir, 'sitemap.xml'), xml);
fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml);
