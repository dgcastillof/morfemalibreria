const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const esbuild = require('esbuild');
const ejs = require('ejs');
const sharp = require('sharp');

const srcDir = path.join(__dirname, 'src');
const publicDir = path.join(__dirname, 'public');
const distDir = path.join(__dirname, 'dist');
const coverDir = path.join(publicDir, 'fotos');
const version = Date.now().toString();

// Image sizes for cover variants. Cards rarely exceed ~300px wide, while detail
// pages display covers up to ~350px. We generate higher resolution assets to
// serve crisp images on HiDPI screens without exceeding ~900px physical width.
const coverSizes = [
  { width: 480, suffix: '-480w' },
  { width: 900, suffix: '-900w' },
];

const coverExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp']);

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

function toPosixPath(filePath) {
  return filePath.split(path.sep).join('/');
}

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
      const passthroughModules = new Set([
        'comments-esm.js',
        'analytics-esm.js',
        'analytics-dashboard.js',
        'firebase-app.js',
        'firebase-config.js',
        'auth-esm.js',
        'user-profile.js',
        'login-controller.js',
        'registro-controller.js',
        'password-reset-controller.js',
        'verifica-email-controller.js',
        'auth-action-controller.js',
        'session-listener.js',
      ]);
      if (passthroughModules.has(entry.name)) {
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
      const { code } = esbuild.transformSync(css, {
        loader: 'css',
        minify: true,
      });
      fs.writeFileSync(outFile, code);
    }
  }
}

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

const escapedCache = new Map();
function escapeForRegex(value) {
  if (escapedCache.has(value)) return escapedCache.get(value);
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  escapedCache.set(value, escaped);
  return escaped;
}

function copyPublicAssets() {
  const coverRoot = path.resolve(coverDir);
  const deprecatedConfig = path.resolve(publicDir, 'firebase-config.js');
  fs.cpSync(publicDir, distDir, {
    recursive: true,
    filter: (source) => {
      const resolved = path.resolve(source);
      // Skip cover images (processed separately) and deprecated config file
      if (resolved.startsWith(coverRoot)) return false;
      if (resolved === deprecatedConfig) return false;
      return true;
    },
  });
}

async function generateCoverVariants() {
  const variants = new Map();
  if (!fs.existsSync(coverDir)) return variants;

  const files = getAllFiles(coverDir).filter((file) =>
    coverExtensions.has(path.extname(file).toLowerCase()),
  );

  await Promise.all(
    files.map(async (file) => {
      const rel = path.relative(coverDir, file);
      const ext = path.extname(rel);
      const baseName = path.basename(rel, ext);
      const relDir = path.dirname(rel);
      const baseRel = relDir === '.' ? baseName : path.join(relDir, baseName);

      const variant = {};
      for (const size of coverSizes) {
        const relFileName =
          relDir === '.'
            ? `${baseName}${size.suffix}`
            : path.join(relDir, `${baseName}${size.suffix}`);
        const webpRelative = toPosixPath(
          path.join('fotos', `${relFileName}.webp`),
        );
        const jpegRelative = toPosixPath(
          path.join('fotos', `${relFileName}.jpg`),
        );
        const webpOutput = path.join(distDir, webpRelative);
        const jpegOutput = path.join(distDir, jpegRelative);
        fs.mkdirSync(path.dirname(webpOutput), { recursive: true });

        await sharp(file)
          .resize({ width: size.width, withoutEnlargement: true })
          .webp({ quality: 82 })
          .toFile(webpOutput);

        await sharp(file)
          .resize({ width: size.width, withoutEnlargement: true })
          .jpeg({ quality: 82, progressive: true })
          .toFile(jpegOutput);

        if (size.width <= coverSizes[0].width) {
          variant.webpSmall = webpRelative;
          variant.jpegSmall = jpegRelative;
        } else {
          variant.webpLarge = webpRelative;
          variant.jpegLarge = jpegRelative;
        }
      }

      variants.set(toPosixPath(path.join('fotos', baseRel)), variant);
    }),
  );

  return variants;
}

function enhanceBookWithVariants(book, coverVariants) {
  const enhanced = { ...book };
  const basePath = toPosixPath(book.imagen.replace(/^\//, ''));
  const baseWithoutExt = basePath.replace(/\.[^.]+$/, '');
  const variant = coverVariants.get(baseWithoutExt);

  if (variant) {
    enhanced.imagen = variant.webpLarge || variant.webpSmall || enhanced.imagen;
    enhanced.imagenSmall = variant.webpSmall || variant.webpLarge;
    enhanced.imagenFallback = variant.jpegLarge || variant.jpegSmall;
    enhanced.imagenFallbackSmall = variant.jpegSmall || variant.jpegLarge;
  } else {
    console.warn(`No optimized cover found for ${book.imagen}`);
  }

  return enhanced;
}

async function buildBooksJson(coverVariants) {
  const booksPath = path.join(publicDir, 'books.json');
  const rawBooks = JSON.parse(fs.readFileSync(booksPath, 'utf8'));
  const enhancedBooks = rawBooks.map((book) =>
    enhanceBookWithVariants(book, coverVariants),
  );
  fs.writeFileSync(
    path.join(distDir, 'books.json'),
    JSON.stringify(enhancedBooks, null, 2),
  );
}

function hashAssets() {
  const manifest = new Map();
  for (const file of getAllFiles(distDir)) {
    const ext = path.extname(file).toLowerCase();
    if (!assetExtensions.has(ext)) continue;

    const relativePath = toPosixPath(path.relative(distDir, file));
    if (relativePath === 'comments-esm.js') continue;

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

  return Array.from(manifest.entries()).sort(
    ([a], [b]) => b.length - a.length,
  );
}

function updateReferences(filePath, replacements) {
  const ext = path.extname(filePath).toLowerCase();
  if (!textExtensions.has(ext)) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let updated = content;

  for (const [original, hashed] of replacements) {
    const escapedOriginal = escapeForRegex(original);

    // Replace absolute paths starting with / but not in external URLs
    // Use quotes or start of attribute to identify local absolute paths
    updated = updated.replace(new RegExp(`(['"\`])/${escapedOriginal}`, 'g'), `$1/${hashed}`);

    // Replace relative paths (like ./filename.js)
    updated = updated.replace(new RegExp(`(\\./)${escapedOriginal}`, 'g'), `$1${hashed}`);

    // Replace quoted bare relative paths (e.g., JSON values like "fotos/cover.webp")
    updated = updated.replace(new RegExp(`(['"\`])${escapedOriginal}`, 'g'), `$1${hashed}`);

    // Replace unquoted url() references commonly used in CSS
    updated = updated.replace(
      new RegExp(`(url\\()(?!['"])${escapedOriginal}(\\))`, 'g'),
      `$1${hashed}$2`,
    );
  }

  if (ext === '.html') {
    for (const [, hashed] of replacements) {
      const escapedHashed = escapeForRegex(hashed);
      const escapedAbsoluteHashed = escapeForRegex(`/${hashed}`);

      updated = updated.replace(
        new RegExp(`${escapedAbsoluteHashed}(?!\\?v=)`, 'g'),
        `/${hashed}?v=${version}`,
      );
      updated = updated.replace(
        new RegExp(`${escapedHashed}(?!\\?v=)`, 'g'),
        `${hashed}?v=${version}`,
      );
    }
  }

  if (updated !== content) {
    fs.writeFileSync(filePath, updated);
  }
}

async function main() {
  fs.rmSync(distDir, { recursive: true, force: true });
  fs.mkdirSync(distDir, { recursive: true });

  copyPublicAssets();
  const coverVariants = await generateCoverVariants();
  processDir(srcDir, distDir);
  await buildBooksJson(coverVariants);

  const replacements = hashAssets();
  for (const file of getAllFiles(distDir)) {
    updateReferences(file, replacements);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
