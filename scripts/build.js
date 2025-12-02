const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const esbuild = require('esbuild');
const ejs = require('ejs');
const sharp = require('sharp');

// Root directory is one level up from scripts/
const rootDir = path.join(__dirname, '..');
const srcDir = path.join(rootDir, 'src');
const publicDir = path.join(rootDir, 'public');
const distDir = path.join(rootDir, 'dist');
const coverDir = path.join(publicDir, 'images', 'fotos');
const version = Date.now().toString();

// Cache navbar HTML for injection
let navbarHtml = null;
function getNavbarHtml() {
  if (navbarHtml === null) {
    const navbarPath = path.join(srcDir, 'components', 'navbar.html');
    if (fs.existsSync(navbarPath)) {
      navbarHtml = fs.readFileSync(navbarPath, 'utf8').trim();
    } else {
      navbarHtml = '';
    }
  }
  return navbarHtml;
}

/**
 * Inject navbar HTML into a page's navbar container
 * Replaces <div id="navbar" data-current="..."></div> with navbar content inside
 */
function injectNavbar(html) {
  const navbar = getNavbarHtml();
  if (!navbar) return html;
  
  // Match <div id="navbar" ...></div> and inject content
  return html.replace(
    /(<div\s+id="navbar"[^>]*>)(\s*<\/div>)/gi,
    (match, openTag, closeTag) => `${openTag}\n${navbar}\n  ${closeTag}`
  );
}

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

/**
 * Process a single file: compile/minify based on type
 */
function processFile(srcFile, outFile) {
  const name = path.basename(srcFile);
  
  if (name.endsWith('.ejs')) {
    const template = fs.readFileSync(srcFile, 'utf8');
    let html = ejs.render(template, {}, { filename: srcFile });
    html = injectNavbar(html);
    fs.writeFileSync(outFile.replace(/\.ejs$/, '.html'), html);
  } else if (name.endsWith('.html')) {
    // Inject navbar into HTML pages (skip navbar.html itself)
    if (name !== 'navbar.html') {
      let html = fs.readFileSync(srcFile, 'utf8');
      html = injectNavbar(html);
      fs.writeFileSync(outFile, html);
    } else {
      fs.copyFileSync(srcFile, outFile);
    }
  } else if (name.endsWith('.js')) {
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
    if (passthroughModules.has(name)) {
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
  } else if (name.endsWith('.css')) {
    const css = fs.readFileSync(srcFile, 'utf8');
    const { code } = esbuild.transformSync(css, {
      loader: 'css',
      minify: true,
    });
    fs.writeFileSync(outFile, code);
  }
}

/**
 * Process src directory with new structure:
 * - pages/ -> dist/ (flattened)
 * - components/ -> dist/ (flattened)
 * - js/**  -> dist/ (flattened)
 * - styles/ -> dist/ (flattened)
 * - content/textos-de-morfema/ -> dist/textos-de-morfema/ (preserved)
 * - templates/ -> skipped
 */
function processSrc() {
  fs.mkdirSync(distDir, { recursive: true });

  // Process pages - flatten to dist root
  const pagesDir = path.join(srcDir, 'pages');
  if (fs.existsSync(pagesDir)) {
    for (const file of fs.readdirSync(pagesDir)) {
      // Skip talleres.ejs - it's processed separately with data
      if (file === 'talleres.ejs') continue;
      const srcFile = path.join(pagesDir, file);
      if (fs.statSync(srcFile).isFile()) {
        const outFile = path.join(distDir, file);
        processFile(srcFile, outFile);
      }
    }
  }

  // Process components - flatten to dist root
  const componentsDir = path.join(srcDir, 'components');
  if (fs.existsSync(componentsDir)) {
    for (const file of fs.readdirSync(componentsDir)) {
      const srcFile = path.join(componentsDir, file);
      if (fs.statSync(srcFile).isFile()) {
        const outFile = path.join(distDir, file);
        processFile(srcFile, outFile);
      }
    }
  }

  // Process js directory recursively - flatten all JS to dist root
  const jsDir = path.join(srcDir, 'js');
  if (fs.existsSync(jsDir)) {
    const processJsDir = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const srcFile = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          processJsDir(srcFile);
        } else if (entry.name.endsWith('.js')) {
          const outFile = path.join(distDir, entry.name);
          processFile(srcFile, outFile);
        }
      }
    };
    processJsDir(jsDir);
  }

  // Process styles - flatten to dist root
  const stylesDir = path.join(srcDir, 'styles');
  if (fs.existsSync(stylesDir)) {
    for (const file of fs.readdirSync(stylesDir)) {
      const srcFile = path.join(stylesDir, file);
      if (fs.statSync(srcFile).isFile() && file.endsWith('.css')) {
        const outFile = path.join(distDir, file);
        processFile(srcFile, outFile);
      }
    }
  }

  // Process content directory - preserve structure
  const contentDir = path.join(srcDir, 'content');
  if (fs.existsSync(contentDir)) {
    const processContentDir = (srcPath, outPath) => {
      fs.mkdirSync(outPath, { recursive: true });
      for (const entry of fs.readdirSync(srcPath, { withFileTypes: true })) {
        const srcFile = path.join(srcPath, entry.name);
        const outFile = path.join(outPath, entry.name);
        if (entry.isDirectory()) {
          processContentDir(srcFile, outFile);
        } else {
          processFile(srcFile, outFile);
        }
      }
    };
    processContentDir(contentDir, distDir);
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
  const imagesDir = path.join(publicDir, 'images');
  const coverRoot = path.resolve(coverDir);
  const deprecatedConfig = path.resolve(publicDir, 'firebase-config.js');
  
  // Copy non-image files from public root (books.json, robots.txt, etc.)
  fs.cpSync(publicDir, distDir, {
    recursive: true,
    filter: (source) => {
      const resolved = path.resolve(source);
      // Skip images directory (handled separately) and deprecated config
      if (resolved.startsWith(path.resolve(imagesDir))) return false;
      if (resolved === deprecatedConfig) return false;
      return true;
    },
  });

  // Copy images from public/images to dist root (favicon.ico, background.webp, etc.)
  // but skip cover images (fotos/) which are processed separately
  if (fs.existsSync(imagesDir)) {
    for (const entry of fs.readdirSync(imagesDir, { withFileTypes: true })) {
      const srcPath = path.join(imagesDir, entry.name);
      const destPath = path.join(distDir, entry.name);
      
      // Skip fotos directory - covers are processed separately
      if (entry.name === 'fotos') continue;
      
      if (entry.isDirectory()) {
        fs.cpSync(srcPath, destPath, { recursive: true });
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
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

/**
 * Format a date string to Spanish format (e.g., "5 de diciembre")
 */
function formatearFechaES(fechaISO) {
  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  const fecha = new Date(fechaISO + 'T00:00:00');
  const dia = fecha.getDate();
  const mes = meses[fecha.getMonth()];
  return `${dia} de ${mes}`;
}

/**
 * Process talleres.ejs template with data from talleres.json
 */
function processTalleresTemplate() {
  const talleresJsonPath = path.join(publicDir, 'talleres.json');
  const talleresEjsPath = path.join(srcDir, 'pages', 'talleres.ejs');
  
  if (!fs.existsSync(talleresJsonPath) || !fs.existsSync(talleresEjsPath)) {
    return;
  }

  const talleres = JSON.parse(fs.readFileSync(talleresJsonPath, 'utf8'));
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Add formatted date to each taller
  const talleresConFecha = talleres
    .filter(t => t.activo)
    .map(t => ({
      ...t,
      fechaFormateada: formatearFechaES(t.fechaInicio)
    }))
    .sort((a, b) => new Date(a.fechaInicio) - new Date(b.fechaInicio));

  // Split into upcoming and past
  const talleresProximos = talleresConFecha.filter(t => new Date(t.fechaInicio + 'T00:00:00') >= now);
  const talleresPasados = talleresConFecha.filter(t => new Date(t.fechaInicio + 'T00:00:00') < now);

  const template = fs.readFileSync(talleresEjsPath, 'utf8');
  let html = ejs.render(template, { talleresProximos, talleresPasados }, { filename: talleresEjsPath });
  html = injectNavbar(html);
  fs.writeFileSync(path.join(distDir, 'talleres.html'), html);
}

async function main() {
  fs.rmSync(distDir, { recursive: true, force: true });
  fs.mkdirSync(distDir, { recursive: true });

  copyPublicAssets();
  const coverVariants = await generateCoverVariants();
  processSrc();
  processTalleresTemplate();
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
