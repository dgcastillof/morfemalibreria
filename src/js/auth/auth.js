/**
 * Auth forms handling - validation, loading states, and simulated async behavior
 * This module provides UI interaction for auth pages without real backend logic
 */

(function () {
  'use strict';

  // Simple email validation regex
  var EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var MIN_PASSWORD_LENGTH = 6;
  var SIMULATED_DELAY = 1500; // ms

  /**
   * Show a message in a message container
   */
  function showMessage(containerId, text, type) {
    var container = document.getElementById(containerId);
    if (!container) return;
    container.textContent = text;
    container.className = 'auth-message show ' + type;
  }

  /**
   * Hide a message container
   */
  function hideMessage(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;
    container.className = 'auth-message';
    container.textContent = '';
  }

  /**
   * Show field error
   */
  function showFieldError(inputId, errorId) {
    var input = document.getElementById(inputId);
    var error = document.getElementById(errorId);
    if (input) input.classList.add('input-error');
    if (error) error.classList.add('show');
  }

  /**
   * Hide field error
   */
  function hideFieldError(inputId, errorId) {
    var input = document.getElementById(inputId);
    var error = document.getElementById(errorId);
    if (input) input.classList.remove('input-error');
    if (error) error.classList.remove('show');
  }

  /**
   * Set button loading state
   */
  function setLoading(buttonId, loading) {
    var button = document.getElementById(buttonId);
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
   */
  function isValidEmail(email) {
    return EMAIL_REGEX.test(email);
  }

  /**
   * Handle login form submission
   */
  function handleLoginSubmit(e) {
    e.preventDefault();
    
    var email = document.getElementById('login-email').value.trim();
    var password = document.getElementById('login-password').value;
    var isValid = true;

    // Reset errors
    hideFieldError('login-email', 'login-email-error');
    hideFieldError('login-password', 'login-password-error');
    hideMessage('login-message');

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

    // Simulate async login
    setLoading('login-submit', true);

    setTimeout(function () {
      setLoading('login-submit', false);
      // Simulated success - in real implementation this would check credentials
      showMessage('login-message', '¡Inicio de sesión exitoso! (simulado)', 'success');
    }, SIMULATED_DELAY);
  }

  /**
   * Handle register form submission
   */
  function handleRegisterSubmit(e) {
    e.preventDefault();

    var email = document.getElementById('register-email').value.trim();
    var password = document.getElementById('register-password').value;
    var confirmPassword = document.getElementById('register-password-confirm').value;
    var isValid = true;

    // Reset errors
    hideFieldError('register-email', 'register-email-error');
    hideFieldError('register-password', 'register-password-error');
    hideFieldError('register-password-confirm', 'register-password-confirm-error');
    hideMessage('register-message');

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

    // Simulate async registration
    setLoading('register-submit', true);

    setTimeout(function () {
      setLoading('register-submit', false);
      // Simulated success
      showMessage('register-message', '¡Cuenta creada exitosamente! (simulado) Redirigiendo a verificación...', 'success');
      
      // Simulate redirect to verification page
      setTimeout(function () {
        window.location.href = '/verifica-email.html';
      }, 1500);
    }, SIMULATED_DELAY);
  }

  /**
   * Handle password reset form submission
   */
  function handleResetSubmit(e) {
    e.preventDefault();

    var email = document.getElementById('reset-email').value.trim();
    var isValid = true;

    // Reset errors
    hideFieldError('reset-email', 'reset-email-error');
    hideMessage('reset-message');

    // Validate email
    if (!email || !isValidEmail(email)) {
      showFieldError('reset-email', 'reset-email-error');
      isValid = false;
    }

    if (!isValid) return;

    // Simulate async reset
    setLoading('reset-submit', true);

    setTimeout(function () {
      setLoading('reset-submit', false);
      // Always show success for security (don't reveal if email exists)
      showMessage('reset-message', 'Si el email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña. (simulado)', 'success');
      // Clear the form
      document.getElementById('reset-email').value = '';
    }, SIMULATED_DELAY);
  }

  /**
   * Handle resend verification email
   */
  function handleResendVerification() {
    var button = document.getElementById('resend-button');
    if (!button) return;

    hideMessage('verify-message');
    
    // Set loading state on secondary button
    button.classList.add('loading');
    button.disabled = true;

    setTimeout(function () {
      button.classList.remove('loading');
      button.disabled = false;
      showMessage('verify-message', 'Email de verificación reenviado. (simulado)', 'success');
    }, SIMULATED_DELAY);
  }

  /**
   * Clear field errors on input
   */
  function setupInputListeners() {
    var inputs = [
      { input: 'login-email', error: 'login-email-error' },
      { input: 'login-password', error: 'login-password-error' },
      { input: 'register-email', error: 'register-email-error' },
      { input: 'register-password', error: 'register-password-error' },
      { input: 'register-password-confirm', error: 'register-password-confirm-error' },
      { input: 'reset-email', error: 'reset-email-error' }
    ];

    inputs.forEach(function (item) {
      var input = document.getElementById(item.input);
      if (input) {
        input.addEventListener('input', function () {
          hideFieldError(item.input, item.error);
        });
      }
    });
  }

  /**
   * Initialize auth forms
   */
  function init() {
    // Login form
    var loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', handleLoginSubmit);
    }

    // Register form
    var registerForm = document.getElementById('register-form');
    if (registerForm) {
      registerForm.addEventListener('submit', handleRegisterSubmit);
    }

    // Reset form
    var resetForm = document.getElementById('reset-form');
    if (resetForm) {
      resetForm.addEventListener('submit', handleResetSubmit);
    }

    // Resend verification button
    var resendButton = document.getElementById('resend-button');
    if (resendButton) {
      resendButton.addEventListener('click', handleResendVerification);
    }

    // Setup input listeners
    setupInputListeners();
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
