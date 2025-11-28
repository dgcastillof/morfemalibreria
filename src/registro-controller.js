/**
 * Registration Controller
 *
 * Handles the registration form submission with Firebase Auth.
 * Creates user account, sends verification email, and saves profile to Firestore.
 */

import { registerWithEmail, sendVerificationEmail, onAuthChange } from './auth-esm.js';
import { createUserProfile } from './user-profile.js';

// Simple email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

/**
 * Show a message in the message container
 * @param {string} text - Message text
 * @param {'error' | 'success' | 'warning'} type - Message type
 */
function showMessage(text, type) {
  const container = document.getElementById('register-message');
  if (!container) return;
  container.textContent = text;
  container.className = 'auth-message show ' + type;
}

/**
 * Hide the message container
 */
function hideMessage() {
  const container = document.getElementById('register-message');
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
  const button = document.getElementById('register-submit');
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
 * Handle the registration form submission
 * @param {Event} e - The submit event
 */
async function handleRegisterSubmit(e) {
  e.preventDefault();

  const nameInput = document.getElementById('register-name');
  const emailInput = document.getElementById('register-email');
  const passwordInput = document.getElementById('register-password');
  const confirmPasswordInput = document.getElementById('register-password-confirm');

  const displayName = nameInput?.value.trim() || '';
  const email = emailInput?.value.trim() || '';
  const password = passwordInput?.value || '';
  const confirmPassword = confirmPasswordInput?.value || '';
  let isValid = true;

  // Reset errors
  hideFieldError('register-email', 'register-email-error');
  hideFieldError('register-password', 'register-password-error');
  hideFieldError('register-password-confirm', 'register-password-confirm-error');
  hideMessage();

  // Validate email
  if (!email || !isValidEmail(email)) {
    showFieldError('register-email', 'register-email-error');
    isValid = false;
  }

  // Validate password length
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    showFieldError('register-password', 'register-password-error');
    isValid = false;
  }

  // Validate password confirmation
  if (password !== confirmPassword) {
    showFieldError('register-password-confirm', 'register-password-confirm-error');
    isValid = false;
  }

  if (!isValid) return;

  // Start registration
  setLoading(true);

  try {
    // Create the user account
    const user = await registerWithEmail(email, password);

    // Send verification email
    try {
      await sendVerificationEmail(user);
    } catch (verifyError) {
      console.error('Error sending verification email:', verifyError);
      // Continue even if verification email fails - user can resend later
    }

    // Create Firestore profile
    try {
      await createUserProfile(user, { displayName });
    } catch (profileError) {
      console.error('Error creating user profile:', profileError);
      // Continue even if profile creation fails - can be synced later
    }

    // Success message
    showMessage(
      '¡Cuenta creada exitosamente! Te enviamos un email de verificación. Redirigiendo...',
      'success'
    );

    // Redirect to verification page
    setTimeout(() => {
      window.location.href = '/verifica-email.html';
    }, 2000);
  } catch (error) {
    showMessage(error.message || 'Error al crear la cuenta. Intenta de nuevo.', 'error');
    setLoading(false);
  }
}

/**
 * Set up input listeners to clear errors on typing
 */
function setupInputListeners() {
  const inputs = [
    { input: 'register-email', error: 'register-email-error' },
    { input: 'register-password', error: 'register-password-error' },
    { input: 'register-password-confirm', error: 'register-password-confirm-error' },
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
 * Initialize the registration controller
 */
function init() {
  const form = document.getElementById('register-form');
  if (form) {
    form.addEventListener('submit', handleRegisterSubmit);
  }

  setupInputListeners();

  // If user is already logged in and verified, redirect
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
