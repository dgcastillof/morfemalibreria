const fs = require('fs');
const path = require('path');
const assert = require('assert');
const Ajv = require('ajv');

const distDir = path.join(__dirname, '..', 'dist');

/**
 * List of required HTML pages that must exist in dist/ after build.
 * These are not hashed, so we check for exact filenames.
 */
const requiredHtmlPages = [
  // Core pages
  'index.html',
  'catalogo.html',
  'libro.html',
  '404.html',
  // Auth pages
  'login.html',
  'registro.html',
  'olvide-clave.html',
  'verifica-email.html',
];

/**
 * List of required ESM modules that must exist in dist/ after build.
 * These get content hashes, so we check by base name pattern.
 */
const requiredEsmModules = [
  // Core ESM modules (comments-esm.js is not hashed)
  'comments-esm.js',
  // Auth modules (hashed)
  'auth-esm',
  // Auth controllers (hashed)
  'login-controller',
  'registro-controller',
  'password-reset-controller',
  'verifica-email-controller',
  // Supporting modules (hashed)
  'user-profile',
  'session-listener',
  'firebase-app',
];

/**
 * Find a file in dist/ by base name (handles hashed filenames)
 * @param {string} baseName - The base name to search for (e.g., 'auth-esm')
 * @returns {string|null} The full filename if found, null otherwise
 */
function findDistFile(baseName) {
  const files = fs.readdirSync(distDir);

  // First check for exact match
  if (files.includes(baseName)) {
    return baseName;
  }

  // Then check for hashed version (e.g., 'auth-esm.abc123.js')
  const pattern = new RegExp(`^${baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.[a-f0-9]+\\.js$`);
  const match = files.find(f => pattern.test(f));
  return match || null;
}

/**
 * Check that all required files exist in dist/
 */
function checkRequiredFiles() {
  console.log('Checking required files in dist/...');
  const missing = [];

  // Check HTML pages (exact match)
  for (const file of requiredHtmlPages) {
    const filePath = path.join(distDir, file);
    if (!fs.existsSync(filePath)) {
      missing.push(file);
    }
  }

  // Check ESM modules (handle hashing)
  for (const baseName of requiredEsmModules) {
    const found = findDistFile(baseName);
    if (!found) {
      missing.push(`${baseName}*.js`);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required files in dist/:\n  - ${missing.join('\n  - ')}`
    );
  }

  const totalFiles = requiredHtmlPages.length + requiredEsmModules.length;
  console.log(`  ✓ All ${totalFiles} required files present`);
}

/**
 * Validate books.json schema and content
 */
function validateBooksJson() {
  console.log('Validating books.json...');

  const schemaPath = path.join(__dirname, '..', 'config', 'books.schema.json');
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  const ajv = new Ajv();
  const validate = ajv.compile(schema);

  const content = fs.readFileSync(path.join(distDir, 'books.json'), 'utf8');
  const data = JSON.parse(content);
  assert.ok(Array.isArray(data), 'books.json should contain an array');

  const valid = validate(data);
  if (!valid) {
    console.error('Schema validation errors:', validate.errors);
    throw new Error('books.json failed schema validation');
  }

  const ids = new Set();
  data.forEach((book, idx) => {
    assert.ok(!ids.has(book.id), `Duplicate id ${book.id} at index ${idx}`);
    ids.add(book.id);

    const numericPrice = parseFloat(String(book.precio).replace(/[^0-9.-]+/g, ''));
    assert.ok(!Number.isNaN(numericPrice), `precio at index ${idx} is not numeric`);
  });

  console.log('  ✓ books.json valid');
}

/**
 * Check that ESM modules have expected exports by reading their content.
 * This is a lightweight syntax check.
 */
function checkModuleSyntax() {
  console.log('Checking ESM module syntax...');

  const esmModules = [
    { baseName: 'auth-esm', exports: ['registerWithEmail', 'loginWithEmail', 'onAuthChange', 'sendPasswordReset'] },
    { baseName: 'user-profile', exports: ['createUserProfile', 'syncUserProfile'] },
  ];

  for (const mod of esmModules) {
    const filename = findDistFile(mod.baseName);
    if (!filename) {
      throw new Error(`Could not find ${mod.baseName}*.js in dist/`);
    }

    const filePath = path.join(distDir, filename);
    const content = fs.readFileSync(filePath, 'utf8');

    // Check for expected export names in the file content
    for (const exp of mod.exports) {
      const exportPattern = new RegExp(`export\\s+(async\\s+)?function\\s+${exp}|export\\s+{[^}]*\\b${exp}\\b|export\\s+const\\s+${exp}`);
      if (!exportPattern.test(content)) {
        throw new Error(`${filename} is missing expected export: ${exp}`);
      }
    }
  }

  console.log('  ✓ ESM modules contain expected exports');
}

/**
 * Run auth validation unit tests
 */
function runAuthValidationTests() {
  const { runTests } = require('./auth-validation.js');
  runTests();
}

/**
 * Run auth forms DOM tests (if jsdom is available)
 */
function runAuthFormsDOMTests() {
  try {
    require('jsdom');
    const { runDOMTests } = require('./auth-forms-dom.js');
    runDOMTests();
  } catch (e) {
    console.log('Skipping DOM tests: jsdom not installed');
    console.log('  Install with: npm install --save-dev jsdom');
  }
}

try {
  console.log('\n=== Running build verification tests ===\n');

  checkRequiredFiles();
  validateBooksJson();
  checkModuleSyntax();

  console.log('\n=== Running auth validation tests ===\n');
  runAuthValidationTests();

  console.log('\n=== Running auth forms DOM tests ===\n');
  runAuthFormsDOMTests();

  console.log('\n=== All tests passed ===\n');
} catch (err) {
  console.error('\nTest failed:', err.message);
  process.exit(1);
}
