const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const esbuild = require('esbuild');
const ejs = require('ejs');

const srcDir = path.join(__dirname, 'src');
const publicDir = path.join(__dirname, 'public');
const distDir = path.join(__dirname, 'dist');

const assetExtensions = new Set([
  '.js',
  '.css',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.svg',
  '.ico',
]);

const textExtensions = new Set(['.html', '.js', '.css', '.json', '.xml']);

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });

// copy static assets from public
fs.cpSync(publicDir, distDir, { recursive: true });

function processDir(srcPath, outPath) {
  fs.mkdirSync(outPath, { recursive: true });
  for (const entry of fs.readdirSync(srcPath, { withFileTypes: true })) {
    const srcFile = path.join(srcPath, entry.name);
    const outFile = path.join(outPath, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'templates') continue;
      processDir(srcFile, outFile);
    } else if (entry.name.endsWith('.ejs')) {
      const template = fs.readFileSync(srcFile, 'utf8');
      const html = ejs.render(template, {}, { filename: srcFile });
      fs.writeFileSync(outFile.replace(/\.ejs$/, '.html'), html);
    } else if (entry.name.endsWith('.html')) {
      fs.copyFileSync(srcFile, outFile);
    } else if (entry.name.endsWith('.js')) {
      if (entry.name === 'comments-esm.js') {
        fs.copyFileSync(srcFile, outFile);
      } else {
        esbuild.buildSync({
          entryPoints: [srcFile],
          outfile: outFile,
          bundle: false,
          minify: true,
          format: 'iife',
        });
      }
    } else if (entry.name.endsWith('.css')) {
      const css = fs.readFileSync(srcFile, 'utf8');
      fs.writeFileSync(outFile, css);
    }
  }
}

processDir(srcDir, distDir);

function getAllFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function hashFile(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 8);
}

function toPosixPath(filePath) {
  return filePath.split(path.sep).join('/');
}

const distFiles = getAllFiles(distDir);
const manifest = new Map();

for (const file of distFiles) {
  const ext = path.extname(file).toLowerCase();
  if (!assetExtensions.has(ext)) continue;

  const hash = hashFile(file);
  const dir = path.dirname(file);
  const base = path.basename(file, ext);
  const hashedName = `${base}.${hash}${ext}`;
  const hashedPath = path.join(dir, hashedName);

  fs.renameSync(file, hashedPath);

  const originalRel = toPosixPath(path.relative(distDir, file));
  const hashedRel = toPosixPath(path.relative(distDir, hashedPath));
  manifest.set(originalRel, hashedRel);
}

const escapedCache = new Map();
function escapeForRegex(value) {
  if (escapedCache.has(value)) return escapedCache.get(value);
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\$&');
  escapedCache.set(value, escaped);
  return escaped;
}

const replacements = Array.from(manifest.entries()).sort(
  ([a], [b]) => b.length - a.length,
);

function updateReferences(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!textExtensions.has(ext)) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let updated = content;

  for (const [original, hashed] of replacements) {
    const escapedOriginal = escapeForRegex(original);
    const escapedAbsolute = escapeForRegex(`/${original}`);

    updated = updated.replace(new RegExp(escapedAbsolute, 'g'), `/${hashed}`);
    updated = updated.replace(new RegExp(escapedOriginal, 'g'), hashed);
  }

  if (updated !== content) {
    fs.writeFileSync(filePath, updated);
  }
}

for (const file of getAllFiles(distDir)) {
  updateReferences(file);
}
