/**
 * Firebase Authentication Module (ESM)
 *
 * This module provides a clean, focused API for Firebase Authentication.
 * It wraps Firebase Auth functions and exposes them in a way that's easy
 * to consume from UI controllers without coupling them to Firebase's low-level APIs.
 *
 * Available exports:
 *
 * - getCurrentUser()
 *     Returns the currently signed-in user, or null if not authenticated.
 *     Note: This only reflects the currently loaded state. For reactive updates,
 *     use onAuthChange() instead.
 *
 * - onAuthChange(callback)
 *     Subscribes to authentication state changes. The callback receives the user
 *     object (or null) whenever the auth state changes.
 *     Returns an unsubscribe function to clean up the listener.
 *
 * - registerWithEmail(email, password)
 *     Creates a new user account with email and password.
 *     Returns a Promise that resolves to the user object on success.
 *     Throws an AuthError on failure with a normalized error code.
 *
 * - loginWithEmail(email, password)
 *     Signs in an existing user with email and password.
 *     Returns a Promise that resolves to the user object on success.
 *     Throws an AuthError on failure with a normalized error code.
 *
 * - logoutUser()
 *     Signs out the current user.
 *     Returns a Promise that resolves when sign-out is complete.
 *
 * - sendPasswordReset(email)
 *     Sends a password reset email to the specified address.
 *     Returns a Promise that resolves when the email is sent.
 *     Throws an AuthError on failure with a normalized error code.
 *
 * - sendVerificationEmail(user)
 *     Sends an email verification to the specified user.
 *     If no user is provided, uses the current user.
 *     Returns a Promise that resolves when the email is sent.
 *     Throws an AuthError on failure with a normalized error code.
 *
 * Error Handling:
 * All async functions throw an AuthError object on failure with:
 * - code: The Firebase error code (e.g., 'auth/invalid-email')
 * - message: A human-readable error message
 * - originalError: The original Firebase error for debugging
 */

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged,
  reload,
  applyActionCode,
  checkActionCode,
  confirmPasswordReset,
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { app } from './firebase-app.js';

/** The Firebase Auth instance */
const auth = getAuth(app);

/**
 * Custom error class for authentication errors.
 * Provides normalized error codes and messages for UI handling.
 */
export class AuthError extends Error {
  /**
   * @param {string} code - The Firebase error code
   * @param {string} message - Human-readable error message
   * @param {Error} [originalError] - The original Firebase error
   */
  constructor(code, message, originalError = null) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.originalError = originalError;
  }
}

/**
 * Map of Firebase error codes to user-friendly messages (Spanish).
 * Add more mappings as needed.
 */
const ERROR_MESSAGES = {
  'auth/invalid-email': 'El email proporcionado no es válido.',
  'auth/user-disabled': 'Esta cuenta ha sido deshabilitada.',
  'auth/user-not-found': 'No existe una cuenta con este email.',
  'auth/wrong-password': 'La contraseña es incorrecta.',
  'auth/email-already-in-use': 'Ya existe una cuenta con este email.',
  'auth/weak-password': 'La contraseña es demasiado débil. Usa al menos 6 caracteres.',
  'auth/operation-not-allowed': 'Esta operación no está permitida.',
  'auth/too-many-requests': 'Demasiados intentos. Intenta de nuevo más tarde.',
  'auth/network-request-failed': 'Error de red. Verifica tu conexión a internet.',
  'auth/invalid-credential': 'Las credenciales proporcionadas no son válidas.',
  'auth/requires-recent-login': 'Por seguridad, debes iniciar sesión nuevamente.',
};

/**
 * Normalize a Firebase error into an AuthError with a user-friendly message.
 * @param {Error} error - The Firebase error
 * @returns {AuthError} A normalized AuthError
 */
function normalizeError(error) {
  const code = error.code || 'auth/unknown-error';
  const message = ERROR_MESSAGES[code] || error.message || 'Ha ocurrido un error inesperado.';
  return new AuthError(code, message, error);
}

/**
 * Get the currently signed-in user.
 *
 * Note: This only reflects the currently loaded state. When the page first loads,
 * this may return null even if a user is signed in, until Firebase restores the
 * session. For reactive updates, use onAuthChange() instead.
 *
 * @returns {import('firebase/auth').User | null} The current user or null
 */
export function getCurrentUser() {
  return auth.currentUser;
}

/**
 * Subscribe to authentication state changes.
 *
 * The callback is invoked immediately with the current auth state,
 * and then again whenever the user signs in or out.
 *
 * @param {function(import('firebase/auth').User | null): void} callback
 *   Called with the user object when signed in, or null when signed out.
 * @returns {function(): void} Unsubscribe function to stop listening
 *
 * @example
 * const unsubscribe = onAuthChange((user) => {
 *   if (user) {
 *     console.log('Signed in as:', user.email);
 *   } else {
 *     console.log('Signed out');
 *   }
 * });
 * // Later, to stop listening:
 * unsubscribe();
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Create a new user account with email and password.
 *
 * @param {string} email - The user's email address
 * @param {string} password - The user's password (min 6 characters)
 * @returns {Promise<import('firebase/auth').User>} The newly created user
 * @throws {AuthError} If registration fails
 *
 * @example
 * try {
 *   const user = await registerWithEmail('user@example.com', 'securePassword123');
 *   console.log('Account created:', user.email);
 * } catch (error) {
 *   console.error(error.code, error.message);
 * }
 */
export async function registerWithEmail(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw normalizeError(error);
  }
}

/**
 * Sign in an existing user with email and password.
 *
 * @param {string} email - The user's email address
 * @param {string} password - The user's password
 * @returns {Promise<import('firebase/auth').User>} The signed-in user
 * @throws {AuthError} If login fails
 *
 * @example
 * try {
 *   const user = await loginWithEmail('user@example.com', 'password123');
 *   console.log('Signed in as:', user.email);
 * } catch (error) {
 *   if (error.code === 'auth/wrong-password') {
 *     // Handle wrong password
 *   }
 * }
 */
export async function loginWithEmail(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw normalizeError(error);
  }
}

/**
 * Sign out the current user.
 *
 * @returns {Promise<void>} Resolves when sign-out is complete
 * @throws {AuthError} If sign-out fails
 *
 * @example
 * await logoutUser();
 * console.log('User signed out');
 */
export async function logoutUser() {
  try {
    await signOut(auth);
  } catch (error) {
    throw normalizeError(error);
  }
}

/**
 * Send a password reset email to the specified address.
 *
 * For security, this function does not reveal whether the email exists
 * in the system. The UI should always show a success message.
 *
 * @param {string} email - The user's email address
 * @returns {Promise<void>} Resolves when the email is sent
 * @throws {AuthError} If sending fails (e.g., invalid email format)
 *
 * @example
 * try {
 *   await sendPasswordReset('user@example.com');
 *   showMessage('If the email exists, you will receive a reset link.');
 * } catch (error) {
 *   console.error('Failed to send reset email:', error.message);
 * }
 */
export async function sendPasswordReset(email) {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw normalizeError(error);
  }
}

/**
 * Verify a user's email using an out-of-band code.
 *
 * @param {string} oobCode - The verification code from the email link
 * @returns {Promise<void>} Resolves when the email is verified
 * @throws {AuthError} If verification fails
 */
export async function verifyEmailWithCode(oobCode) {
  if (!oobCode) {
    throw new AuthError('auth/invalid-action-code', 'Código de verificación inválido.');
  }

  try {
    await applyActionCode(auth, oobCode);
    // Refresh current user to ensure emailVerified reflects latest state
    if (auth.currentUser) {
      await reload(auth.currentUser);
    }
  } catch (error) {
    throw normalizeError(error);
  }
}

/**
 * Retrieve information about an action code (e.g., password reset).
 *
 * @param {string} oobCode - The out-of-band action code
 * @returns {Promise<import('firebase/auth').ActionCodeInfo>} Action code info
 * @throws {AuthError} If the code is invalid or expired
 */
export async function getActionCodeInfo(oobCode) {
  if (!oobCode) {
    throw new AuthError('auth/invalid-action-code', 'Código inválido o faltante.');
  }

  try {
    return await checkActionCode(auth, oobCode);
  } catch (error) {
    throw normalizeError(error);
  }
}

/**
 * Confirm a password reset using an out-of-band code.
 *
 * @param {string} oobCode - The reset code from the email link
 * @param {string} newPassword - The new password to set
 * @returns {Promise<void>} Resolves when password is reset
 * @throws {AuthError} If the reset fails
 */
export async function resetPasswordWithCode(oobCode, newPassword) {
  if (!oobCode) {
    throw new AuthError('auth/invalid-action-code', 'Código inválido o faltante.');
  }
  if (!newPassword) {
    throw new AuthError('auth/invalid-password', 'La contraseña no puede estar vacía.');
  }

  try {
    await confirmPasswordReset(auth, oobCode, newPassword);
  } catch (error) {
    throw normalizeError(error);
  }
}

/**
 * Send an email verification to a user.
 *
 * @param {import('firebase/auth').User} [user] - The user to verify.
 *   If not provided, uses the current user.
 * @returns {Promise<void>} Resolves when the email is sent
 * @throws {AuthError} If sending fails or no user is available
 *
 * @example
 * // Send to current user
 * await sendVerificationEmail();
 *
 * // Send to a specific user (e.g., after registration)
 * const newUser = await registerWithEmail(email, password);
 * await sendVerificationEmail(newUser);
 */
export async function sendVerificationEmail(user = null) {
  const targetUser = user || auth.currentUser;

  if (!targetUser) {
    throw new AuthError(
      'auth/no-current-user',
      'No hay un usuario autenticado para verificar.'
    );
  }

  try {
    await sendEmailVerification(targetUser);
  } catch (error) {
    throw normalizeError(error);
  }
}

/**
 * Re-export the auth instance for advanced use cases.
 * Most consumers should use the helper functions instead.
 */
export { auth };

/**
 * Reload the current user's data from the server.
 * Useful to refresh emailVerified status after the user clicks the verification link.
 *
 * @returns {Promise<import('firebase/auth').User | null>} The refreshed user or null
 * @throws {AuthError} If reload fails
 *
 * @example
 * const user = await reloadUser();
 * if (user && user.emailVerified) {
 *   console.log('Email is now verified!');
 * }
 */
export async function reloadUser() {
  const user = auth.currentUser;
  if (!user) return null;

  try {
    await reload(user);
    return auth.currentUser;
  } catch (error) {
    throw normalizeError(error);
  }
}

/**
 * Check if the current user has the 'admin' custom claim.
 *
 * Custom claims are set via Firebase Admin SDK (Cloud Functions or backend).
 * This function reads the ID token claims to check for admin privileges.
 *
 * @param {boolean} [forceRefresh=false] - Force refresh the ID token to get latest claims
 * @returns {Promise<boolean>} True if user has admin claim, false otherwise
 *
 * @example
 * const isAdmin = await getAdminClaim();
 * if (isAdmin) {
 *   // Show admin UI
 * } else {
 *   // Redirect to access denied
 * }
 */
export async function getAdminClaim(forceRefresh = false) {
  const user = auth.currentUser;
  if (!user) return false;

  try {
    const tokenResult = await user.getIdTokenResult(forceRefresh);
    return tokenResult.claims.admin === true;
  } catch (error) {
    console.error('Error getting admin claim:', error);
    return false;
  }
}
