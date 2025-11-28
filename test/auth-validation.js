/**
 * Auth Validation Logic Tests
 *
 * Tests the validation logic used by auth forms (login, register, password reset).
 * These tests run without Firebase and verify client-side validation behavior.
 *
 * Run via: npm test (included in the test pipeline)
 */

const assert = require('assert');

// Email validation regex (same as used in controllers)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Whether the email is valid
 */
function isValidEmail(email) {
  return EMAIL_REGEX.test(email);
}

/**
 * Validate password length
 * @param {string} password - Password to validate
 * @returns {boolean} Whether the password meets minimum length
 */
function isValidPassword(password) {
  return typeof password === 'string' && password.length >= MIN_PASSWORD_LENGTH;
}

/**
 * Check if passwords match
 * @param {string} password - First password
 * @param {string} confirmPassword - Confirmation password
 * @returns {boolean} Whether passwords match
 */
function passwordsMatch(password, confirmPassword) {
  return password === confirmPassword;
}

/**
 * Validate registration form fields
 * @param {Object} fields - Form fields
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateRegistration(fields) {
  const errors = [];

  if (!fields.email || !isValidEmail(fields.email)) {
    errors.push('email');
  }

  if (!isValidPassword(fields.password)) {
    errors.push('password');
  }

  if (!passwordsMatch(fields.password, fields.confirmPassword)) {
    errors.push('confirmPassword');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate login form fields
 * @param {Object} fields - Form fields
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateLogin(fields) {
  const errors = [];

  if (!fields.email || !isValidEmail(fields.email)) {
    errors.push('email');
  }

  if (!fields.password) {
    errors.push('password');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate password reset form fields
 * @param {Object} fields - Form fields
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validatePasswordReset(fields) {
  const errors = [];

  if (!fields.email || !isValidEmail(fields.email)) {
    errors.push('email');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Run tests
function runTests() {
  console.log('Running auth validation tests...');

  // Email validation tests
  console.log('  Testing email validation...');
  assert.strictEqual(isValidEmail('user@example.com'), true, 'Valid email should pass');
  assert.strictEqual(isValidEmail('user.name+tag@example.co.uk'), true, 'Complex email should pass');
  assert.strictEqual(isValidEmail(''), false, 'Empty email should fail');
  assert.strictEqual(isValidEmail('invalid'), false, 'Email without @ should fail');
  assert.strictEqual(isValidEmail('invalid@'), false, 'Email without domain should fail');
  assert.strictEqual(isValidEmail('@example.com'), false, 'Email without local part should fail');
  assert.strictEqual(isValidEmail('user @example.com'), false, 'Email with space should fail');
  console.log('    ✓ Email validation works correctly');

  // Password validation tests
  console.log('  Testing password validation...');
  assert.strictEqual(isValidPassword('123456'), true, '6-char password should pass');
  assert.strictEqual(isValidPassword('longerpassword'), true, 'Long password should pass');
  assert.strictEqual(isValidPassword('12345'), false, '5-char password should fail');
  assert.strictEqual(isValidPassword(''), false, 'Empty password should fail');
  assert.strictEqual(isValidPassword(null), false, 'Null password should fail');
  console.log('    ✓ Password validation works correctly');

  // Password match tests
  console.log('  Testing password matching...');
  assert.strictEqual(passwordsMatch('password', 'password'), true, 'Matching passwords should pass');
  assert.strictEqual(passwordsMatch('password', 'different'), false, 'Different passwords should fail');
  assert.strictEqual(passwordsMatch('', ''), true, 'Empty matching passwords should pass');
  console.log('    ✓ Password matching works correctly');

  // Registration validation tests
  console.log('  Testing registration validation...');
  let result = validateRegistration({
    email: 'user@example.com',
    password: 'password123',
    confirmPassword: 'password123',
  });
  assert.strictEqual(result.valid, true, 'Valid registration should pass');
  assert.strictEqual(result.errors.length, 0, 'No errors for valid registration');

  result = validateRegistration({
    email: 'invalid',
    password: 'password123',
    confirmPassword: 'password123',
  });
  assert.strictEqual(result.valid, false, 'Invalid email should fail registration');
  assert.ok(result.errors.includes('email'), 'Should include email error');

  result = validateRegistration({
    email: 'user@example.com',
    password: '12345',
    confirmPassword: '12345',
  });
  assert.strictEqual(result.valid, false, 'Short password should fail registration');
  assert.ok(result.errors.includes('password'), 'Should include password error');

  result = validateRegistration({
    email: 'user@example.com',
    password: 'password123',
    confirmPassword: 'different',
  });
  assert.strictEqual(result.valid, false, 'Mismatched passwords should fail registration');
  assert.ok(result.errors.includes('confirmPassword'), 'Should include confirmPassword error');

  result = validateRegistration({
    email: '',
    password: '',
    confirmPassword: '',
  });
  assert.strictEqual(result.valid, false, 'Empty fields should fail registration');
  assert.ok(result.errors.length >= 2, 'Should have multiple errors');
  console.log('    ✓ Registration validation works correctly');

  // Login validation tests
  console.log('  Testing login validation...');
  result = validateLogin({
    email: 'user@example.com',
    password: 'anypassword',
  });
  assert.strictEqual(result.valid, true, 'Valid login should pass');

  result = validateLogin({
    email: 'invalid',
    password: 'password',
  });
  assert.strictEqual(result.valid, false, 'Invalid email should fail login');
  assert.ok(result.errors.includes('email'), 'Should include email error');

  result = validateLogin({
    email: 'user@example.com',
    password: '',
  });
  assert.strictEqual(result.valid, false, 'Empty password should fail login');
  assert.ok(result.errors.includes('password'), 'Should include password error');
  console.log('    ✓ Login validation works correctly');

  // Password reset validation tests
  console.log('  Testing password reset validation...');
  result = validatePasswordReset({ email: 'user@example.com' });
  assert.strictEqual(result.valid, true, 'Valid email should pass reset');

  result = validatePasswordReset({ email: '' });
  assert.strictEqual(result.valid, false, 'Empty email should fail reset');

  result = validatePasswordReset({ email: 'notanemail' });
  assert.strictEqual(result.valid, false, 'Invalid email should fail reset');
  console.log('    ✓ Password reset validation works correctly');

  console.log('  ✓ All auth validation tests passed');
}

// Export for potential use in other test files
module.exports = {
  isValidEmail,
  isValidPassword,
  passwordsMatch,
  validateRegistration,
  validateLogin,
  validatePasswordReset,
  runTests,
};

// Run tests when this file is executed directly
if (require.main === module) {
  try {
    runTests();
  } catch (err) {
    console.error('\nAuth validation test failed:', err.message);
    process.exit(1);
  }
}
