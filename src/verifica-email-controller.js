/**
 * Email Verification Controller
 *
 * Handles the email verification status page.
 * Shows instructions for verifying email and allows resending verification emails.
 */

import {
  getCurrentUser,
  onAuthChange,
  sendVerificationEmail,
  reloadUser,
} from './auth-esm.js';
import { syncUserProfile } from './user-profile.js';

/**
 * Show a message in the message container
 * @param {string} text - Message text
 * @param {'error' | 'success' | 'warning'} type - Message type
 */
function showMessage(text, type) {
  const container = document.getElementById('verify-message');
  if (!container) return;
  container.textContent = text;
  container.className = 'auth-message show ' + type;
}

/**
 * Hide the message container
 */
function hideMessage() {
  const container = document.getElementById('verify-message');
  if (!container) return;
  container.className = 'auth-message';
  container.textContent = '';
}

/**
 * Set the loading state on the resend button
 * @param {boolean} loading - Whether to show loading state
 */
function setResendLoading(loading) {
  const button = document.getElementById('resend-button');
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
 * Set the loading state on the check verification button
 * @param {boolean} loading - Whether to show loading state
 */
function setCheckLoading(loading) {
  const button = document.getElementById('check-verification-button');
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
 * Handle the resend verification button click
 */
async function handleResendVerification() {
  hideMessage();
  setResendLoading(true);

  try {
    const user = getCurrentUser();
    if (!user) {
      showMessage('No hay una sesión activa. Por favor, iniciá sesión nuevamente.', 'error');
      setTimeout(() => {
        window.location.href = '/login.html';
      }, 2000);
      return;
    }

    await sendVerificationEmail(user);
    showMessage('¡Email de verificación reenviado! Revisá tu bandeja de entrada.', 'success');
  } catch (error) {
    if (error.code === 'auth/too-many-requests') {
      showMessage('Demasiados intentos. Esperá unos minutos antes de intentar de nuevo.', 'error');
    } else {
      showMessage(error.message || 'Error al reenviar el email. Intenta de nuevo.', 'error');
    }
  } finally {
    setResendLoading(false);
  }
}

/**
 * Handle the check verification status button click
 * Reloads user data from server to check if email was verified
 */
async function handleCheckVerification() {
  hideMessage();
  setCheckLoading(true);

  try {
    const user = await reloadUser();

    if (!user) {
      showMessage('No hay una sesión activa. Por favor, iniciá sesión nuevamente.', 'error');
      setTimeout(() => {
        window.location.href = '/login.html';
      }, 2000);
      return;
    }

    if (user.emailVerified) {
      // Sync the profile to update emailVerified in Firestore
      await syncUserProfile(user);

      showMessage('¡Tu email ha sido verificado! Redirigiendo...', 'success');
      setTimeout(() => {
        window.location.href = '/index.html';
      }, 1500);
    } else {
      showMessage('Tu email aún no ha sido verificado. Revisá tu bandeja de entrada.', 'warning');
    }
  } catch (error) {
    showMessage(error.message || 'Error al verificar el estado. Intenta de nuevo.', 'error');
  } finally {
    setCheckLoading(false);
  }
}

/**
 * Update the UI based on the current user state
 * @param {import('firebase/auth').User | null} user - The current user
 */
function updateUI(user) {
  const emailDisplay = document.getElementById('user-email-display');
  const notLoggedInMessage = document.getElementById('not-logged-in-message');
  const verificationContent = document.getElementById('verification-content');

  if (!user) {
    // No user logged in
    if (verificationContent) verificationContent.style.display = 'none';
    if (notLoggedInMessage) notLoggedInMessage.style.display = 'block';
    return;
  }

  // User is logged in
  if (notLoggedInMessage) notLoggedInMessage.style.display = 'none';
  if (verificationContent) verificationContent.style.display = 'block';

  // Display the user's email
  if (emailDisplay) {
    emailDisplay.textContent = user.email || '';
  }

  if (user.emailVerified) {
    // Already verified - sync profile and redirect
    syncUserProfile(user);
    showMessage('¡Tu email ya está verificado! Redirigiendo...', 'success');
    setTimeout(() => {
      window.location.href = '/index.html';
    }, 1500);
  }
}

/**
 * Initialize the verification controller
 */
function init() {
  // Set up resend button
  const resendButton = document.getElementById('resend-button');
  if (resendButton) {
    resendButton.addEventListener('click', handleResendVerification);
  }

  // Set up check verification button
  const checkButton = document.getElementById('check-verification-button');
  if (checkButton) {
    checkButton.addEventListener('click', handleCheckVerification);
  }

  // Listen for auth state changes
  onAuthChange(updateUI);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
