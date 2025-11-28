/**
 * Auth Forms DOM Tests
 *
 * Tests the auth forms' DOM behavior using jsdom.
 * Verifies that forms render correctly and validation UI works as expected.
 *
 * Run via: npm run test:dom (requires jsdom as a dev dependency)
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Check if jsdom is available
let JSDOM;
try {
  JSDOM = require('jsdom').JSDOM;
} catch (e) {
  console.log('Skipping DOM tests: jsdom not installed');
  console.log('Install with: npm install --save-dev jsdom');
  process.exit(0);
}

const distDir = path.join(__dirname, '..', 'dist');

/**
 * Load an HTML file and create a DOM environment
 * @param {string} filename - HTML file name in dist/
 * @returns {JSDOM} The jsdom instance
 */
function loadPage(filename) {
  const htmlPath = path.join(distDir, filename);
  const html = fs.readFileSync(htmlPath, 'utf8');
  return new JSDOM(html, {
    url: 'http://localhost/',
    runScripts: 'outside-only',
  });
}

/**
 * Test registration form structure
 */
function testRegistrationForm() {
  console.log('  Testing registration form structure...');
  const dom = loadPage('registro.html');
  const doc = dom.window.document;

  // Check form exists
  const form = doc.getElementById('register-form');
  assert.ok(form, 'Registration form should exist');

  // Check required inputs
  const nameInput = doc.getElementById('register-name');
  const emailInput = doc.getElementById('register-email');
  const passwordInput = doc.getElementById('register-password');
  const confirmInput = doc.getElementById('register-password-confirm');
  const submitBtn = doc.getElementById('register-submit');

  assert.ok(nameInput, 'Name input should exist');
  assert.ok(emailInput, 'Email input should exist');
  assert.ok(passwordInput, 'Password input should exist');
  assert.ok(confirmInput, 'Password confirm input should exist');
  assert.ok(submitBtn, 'Submit button should exist');

  // Check input types
  assert.strictEqual(emailInput.type, 'email', 'Email input should be type email');
  assert.strictEqual(passwordInput.type, 'password', 'Password input should be type password');
  assert.strictEqual(confirmInput.type, 'password', 'Confirm input should be type password');

  // Check required attributes
  assert.ok(emailInput.required, 'Email should be required');
  assert.ok(passwordInput.required, 'Password should be required');
  assert.ok(confirmInput.required, 'Password confirm should be required');

  // Check error elements exist
  assert.ok(doc.getElementById('register-email-error'), 'Email error element should exist');
  assert.ok(doc.getElementById('register-password-error'), 'Password error element should exist');
  assert.ok(doc.getElementById('register-password-confirm-error'), 'Confirm error element should exist');

  // Check message container exists
  assert.ok(doc.getElementById('register-message'), 'Message container should exist');

  console.log('    ✓ Registration form structure is correct');
}

/**
 * Test login form structure
 */
function testLoginForm() {
  console.log('  Testing login form structure...');
  const dom = loadPage('login.html');
  const doc = dom.window.document;

  // Check form exists
  const form = doc.getElementById('login-form');
  assert.ok(form, 'Login form should exist');

  // Check required inputs
  const emailInput = doc.getElementById('login-email');
  const passwordInput = doc.getElementById('login-password');
  const submitBtn = doc.getElementById('login-submit');

  assert.ok(emailInput, 'Email input should exist');
  assert.ok(passwordInput, 'Password input should exist');
  assert.ok(submitBtn, 'Submit button should exist');

  // Check input types
  assert.strictEqual(emailInput.type, 'email', 'Email input should be type email');
  assert.strictEqual(passwordInput.type, 'password', 'Password input should be type password');

  // Check required attributes
  assert.ok(emailInput.required, 'Email should be required');
  assert.ok(passwordInput.required, 'Password should be required');

  // Check error elements exist
  assert.ok(doc.getElementById('login-email-error'), 'Email error element should exist');
  assert.ok(doc.getElementById('login-password-error'), 'Password error element should exist');

  // Check message container exists
  assert.ok(doc.getElementById('login-message'), 'Message container should exist');

  // Check password reset link
  const resetLink = doc.querySelector('a[href="/olvide-clave.html"]');
  assert.ok(resetLink, 'Password reset link should exist');

  // Check registration link
  const registerLink = doc.querySelector('a[href="/registro.html"]');
  assert.ok(registerLink, 'Registration link should exist');

  console.log('    ✓ Login form structure is correct');
}

/**
 * Test password reset form structure
 */
function testPasswordResetForm() {
  console.log('  Testing password reset form structure...');
  const dom = loadPage('olvide-clave.html');
  const doc = dom.window.document;

  // Check form exists
  const form = doc.getElementById('reset-form');
  assert.ok(form, 'Password reset form should exist');

  // Check required inputs
  const emailInput = doc.getElementById('reset-email');
  const submitBtn = doc.getElementById('reset-submit');

  assert.ok(emailInput, 'Email input should exist');
  assert.ok(submitBtn, 'Submit button should exist');

  // Check input type
  assert.strictEqual(emailInput.type, 'email', 'Email input should be type email');

  // Check required attribute
  assert.ok(emailInput.required, 'Email should be required');

  // Check error element exists
  assert.ok(doc.getElementById('reset-email-error'), 'Email error element should exist');

  // Check message container exists
  assert.ok(doc.getElementById('reset-message'), 'Message container should exist');

  console.log('    ✓ Password reset form structure is correct');
}

/**
 * Test email verification page structure
 */
function testVerifyEmailPage() {
  console.log('  Testing email verification page structure...');
  const dom = loadPage('verifica-email.html');
  const doc = dom.window.document;

  // Check page has expected content
  const title = doc.querySelector('title');
  assert.ok(title, 'Page should have a title');
  assert.ok(title.textContent.toLowerCase().includes('verifi'), 'Title should mention verification');

  // Check message container exists
  assert.ok(
    doc.getElementById('verify-message') || doc.querySelector('.auth-message'),
    'Message container should exist'
  );

  console.log('    ✓ Email verification page structure is correct');
}

/**
 * Test that auth CSS classes are consistent across forms
 */
function testAuthCSSClasses() {
  console.log('  Testing auth CSS class consistency...');

  const pages = ['login.html', 'registro.html', 'olvide-clave.html'];

  for (const page of pages) {
    const dom = loadPage(page);
    const doc = dom.window.document;

    // Check common class structures
    assert.ok(doc.querySelector('.auth-container'), `${page} should have .auth-container`);
    assert.ok(doc.querySelector('.auth-form'), `${page} should have .auth-form`);
    assert.ok(doc.querySelector('.auth-submit'), `${page} should have .auth-submit`);
    assert.ok(doc.querySelector('.auth-field'), `${page} should have .auth-field`);
  }

  console.log('    ✓ Auth CSS classes are consistent');
}

/**
 * Test form novalidate attribute (for custom validation)
 */
function testCustomValidation() {
  console.log('  Testing custom validation setup...');

  const formsToCheck = [
    { page: 'login.html', formId: 'login-form' },
    { page: 'registro.html', formId: 'register-form' },
    { page: 'olvide-clave.html', formId: 'reset-form' },
  ];

  for (const { page, formId } of formsToCheck) {
    const dom = loadPage(page);
    const doc = dom.window.document;
    const form = doc.getElementById(formId);

    assert.ok(form, `${page} should have form #${formId}`);
    assert.ok(form.hasAttribute('novalidate'), `${page} form should have novalidate attribute for custom validation`);
  }

  console.log('    ✓ Custom validation is properly set up');
}

/**
 * Run all DOM tests
 */
function runDOMTests() {
  console.log('Running auth forms DOM tests...');

  testRegistrationForm();
  testLoginForm();
  testPasswordResetForm();
  testVerifyEmailPage();
  testAuthCSSClasses();
  testCustomValidation();

  console.log('  ✓ All auth forms DOM tests passed');
}

module.exports = { runDOMTests };

// Run tests when this file is executed directly
if (require.main === module) {
  try {
    runDOMTests();
  } catch (err) {
    console.error('\nAuth forms DOM test failed:', err.message);
    process.exit(1);
  }
}
