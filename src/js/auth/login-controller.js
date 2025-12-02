/**
 * Login Controller
 *
 * Handles the login form submission with Firebase Auth.
 * Validates input, shows loading/error states, and handles
 * email verification warnings.
 */

import { loginWithEmail, onAuthChange } from './auth-esm.js';
import { syncUserProfile } from './user-profile.js';

// Simple email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Show a message in the message container
 * @param {string} text - Message text
 * @param {'error' | 'success' | 'warning'} type - Message type
 */
function showMessage(text, type) {
  const container = document.getElementById('login-message');
  if (!container) return;
  container.textContent = text;
  container.className = 'auth-message show ' + type;
}

/**
 * Hide the message container
 */
function hideMessage() {
  const container = document.getElementById('login-message');
  if (!container) return;
  container.className = 'auth-message';
  container.textContent = '';
}

/**
 * Show a field error
 * @param {string} inputId - The input element ID
 * @param {string} errorId - The error element ID
 */
function showFieldError(inputId, errorId) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  if (input) input.classList.add('input-error');
  if (error) error.classList.add('show');
}

/**
 * Hide a field error
 * @param {string} inputId - The input element ID
 * @param {string} errorId - The error element ID
 */
function hideFieldError(inputId, errorId) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  if (input) input.classList.remove('input-error');
  if (error) error.classList.remove('show');
}

/**
 * Set the loading state on the submit button
 * @param {boolean} loading - Whether to show loading state
 */
function setLoading(loading) {
  const button = document.getElementById('login-submit');
  if (!button) return;
  if (loading) {
    button.classList.add('loading');
    button.disabled = true;
  } else {
    button.classList.remove('loading');
    button.disabled = false;
  }
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Whether the email is valid
 */
function isValidEmail(email) {
  return EMAIL_REGEX.test(email);
}

/**
 * Handle the login form submission
 * @param {Event} e - The submit event
 */
async function handleLoginSubmit(e) {
  e.preventDefault();

  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');

  const email = emailInput?.value.trim() || '';
  const password = passwordInput?.value || '';
  let isValid = true;

  // Reset errors
  hideFieldError('login-email', 'login-email-error');
  hideFieldError('login-password', 'login-password-error');
  hideMessage();

  // Validate email
  if (!email || !isValidEmail(email)) {
    showFieldError('login-email', 'login-email-error');
    isValid = false;
  }

  // Validate password
  if (!password) {
    showFieldError('login-password', 'login-password-error');
    isValid = false;
  }

  if (!isValid) return;

  // Start login
  setLoading(true);

  try {
    const user = await loginWithEmail(email, password);

    // Clear password field immediately after use (security best practice)
    if (passwordInput) passwordInput.value = '';

    // Sync user profile in Firestore
    await syncUserProfile(user);

    if (!user.emailVerified) {
      // Show warning about unverified email
      showMessage(
        'Tu email aún no ha sido verificado. Por favor, revisá tu bandeja de entrada.',
        'warning'
      );

      // Redirect to verification page after a short delay
      setTimeout(() => {
        window.location.href = '/verifica-email.html';
      }, 2000);
    } else {
      // Success - redirect to home or account
      showMessage('¡Inicio de sesión exitoso!', 'success');
      setTimeout(() => {
        window.location.href = '/index.html';
      }, 1000);
    }
  } catch (error) {
    // Clear password field on error too (security best practice)
    if (passwordInput) passwordInput.value = '';
    showMessage(error.message || 'Error al iniciar sesión. Intenta de nuevo.', 'error');
  } finally {
    setLoading(false);
  }
}

/**
 * Set up input listeners to clear errors on typing
 */
function setupInputListeners() {
  const inputs = [
    { input: 'login-email', error: 'login-email-error' },
    { input: 'login-password', error: 'login-password-error' },
  ];

  inputs.forEach(({ input, error }) => {
    const inputEl = document.getElementById(input);
    if (inputEl) {
      inputEl.addEventListener('input', () => {
        hideFieldError(input, error);
      });
    }
  });
}

/**
 * Initialize the login controller
 */
function init() {
  const form = document.getElementById('login-form');
  if (form) {
    form.addEventListener('submit', handleLoginSubmit);
  }

  setupInputListeners();

  // If user is already logged in, redirect
  onAuthChange((user) => {
    if (user && user.emailVerified) {
      window.location.href = '/index.html';
    }
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
