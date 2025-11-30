/**
 * Auth Action Controller
 *
 * Handles Firebase email action links for verifying emails and resetting passwords.
 * Provides inline feedback while keeping existing auth styles.
 */

import {
  verifyEmailWithCode,
  getActionCodeInfo,
  resetPasswordWithCode,
  getCurrentUser,
} from './auth-esm.js';
import { syncUserProfile } from './user-profile.js';

const MIN_PASSWORD_LENGTH = 6;

function qs(selector) {
  return document.querySelector(selector);
}

function showMessage(text, type = 'success') {
  const container = qs('#action-message');
  if (!container) return;
  container.textContent = text;
  container.className = 'auth-message show ' + type;
}

function clearMessage() {
  const container = qs('#action-message');
  if (!container) return;
  container.textContent = '';
  container.className = 'auth-message';
}

function setLoading(button, loading) {
  if (!button) return;
  if (loading) {
    button.classList.add('loading');
    button.disabled = true;
  } else {
    button.classList.remove('loading');
    button.disabled = false;
  }
}

function toggleSection(sectionId, show) {
  const section = qs(sectionId);
  if (section) {
    section.style.display = show ? 'block' : 'none';
  }
}

function parseParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    mode: params.get('mode'),
    oobCode: params.get('oobCode'),
  };
}

async function handleVerifyEmail(oobCode) {
  const verifySpinner = qs('#verify-loading');
  if (verifySpinner) verifySpinner.style.display = 'block';
  clearMessage();

  try {
    await verifyEmailWithCode(oobCode);
    const currentUser = getCurrentUser();
    if (currentUser) await syncUserProfile(currentUser);
    showMessage('¡Email verificado correctamente! Ya podés iniciar sesión.', 'success');
    setTimeout(() => {
      window.location.href = '/login.html';
    }, 1800);
  } catch (error) {
    showMessage(error.message || 'El enlace de verificación no es válido o expiró.', 'error');
  } finally {
    if (verifySpinner) verifySpinner.style.display = 'none';
  }
}

async function prepareResetPassword(oobCode) {
  const emailLabel = qs('#reset-email-display');
  const submitButton = qs('#action-reset-submit');
  const formSection = qs('#reset-password-section');

  try {
    const info = await getActionCodeInfo(oobCode);
    if (emailLabel && info?.data?.email) {
      emailLabel.textContent = info.data.email;
    }
    toggleSection('#reset-password-section', true);
    if (submitButton) submitButton.dataset.oobCode = oobCode;
  } catch (error) {
    toggleSection('#reset-password-section', false);
    showMessage(error.message || 'El enlace ya no es válido. Solicitá uno nuevo.', 'error');
  }
}

function setupResetValidation() {
  const passwordInput = qs('#action-reset-password');
  const confirmInput = qs('#action-reset-confirm');
  const passwordError = qs('#action-reset-password-error');
  const confirmError = qs('#action-reset-confirm-error');

  const hideErrors = () => {
    passwordInput?.classList.remove('input-error');
    confirmInput?.classList.remove('input-error');
    passwordError?.classList.remove('show');
    confirmError?.classList.remove('show');
  };

  passwordInput?.addEventListener('input', hideErrors);
  confirmInput?.addEventListener('input', hideErrors);
}

function validateResetForm() {
  const passwordInput = qs('#action-reset-password');
  const confirmInput = qs('#action-reset-confirm');
  const passwordError = qs('#action-reset-password-error');
  const confirmError = qs('#action-reset-confirm-error');

  let valid = true;
  const password = passwordInput?.value || '';
  const confirm = confirmInput?.value || '';

  passwordInput?.classList.remove('input-error');
  confirmInput?.classList.remove('input-error');
  passwordError?.classList.remove('show');
  confirmError?.classList.remove('show');
  clearMessage();

  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    passwordInput?.classList.add('input-error');
    passwordError?.classList.add('show');
    valid = false;
  }

  if (password !== confirm) {
    confirmInput?.classList.add('input-error');
    confirmError?.classList.add('show');
    valid = false;
  }

  return valid;
}

async function handleResetSubmit(event) {
  event.preventDefault();

  const submitButton = qs('#action-reset-submit');
  const passwordInput = qs('#action-reset-password');
  const confirmInput = qs('#action-reset-confirm');
  const oobCode = submitButton?.dataset.oobCode;

  if (!validateResetForm()) return;
  setLoading(submitButton, true);

  try {
    await resetPasswordWithCode(oobCode, passwordInput?.value || '');
    if (passwordInput) passwordInput.value = '';
    if (confirmInput) confirmInput.value = '';
    showMessage('Contraseña restablecida con éxito. Ahora podés iniciar sesión.', 'success');
    setTimeout(() => {
      window.location.href = '/login.html';
    }, 1800);
  } catch (error) {
    showMessage(error.message || 'No se pudo restablecer la contraseña.', 'error');
  } finally {
    setLoading(submitButton, false);
  }
}

function init() {
  const { mode, oobCode } = parseParams();

  if (!mode || !oobCode) {
    showMessage('El enlace que usaste no es válido. Revisá que esté completo.', 'error');
    return;
  }

  if (mode === 'verifyEmail') {
    toggleSection('#verify-section', true);
    handleVerifyEmail(oobCode);
  } else if (mode === 'resetPassword') {
    prepareResetPassword(oobCode);
    const form = qs('#reset-password-form');
    form?.addEventListener('submit', handleResetSubmit);
    setupResetValidation();
  } else {
    showMessage('Este enlace no es compatible. Volvé a intentarlo desde la app.', 'error');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
