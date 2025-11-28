/**
 * Session Listener Module
 *
 * Provides global auth state awareness for the navbar and other account sections.
 * Updates the UI based on whether the user is signed in, and their verification status.
 *
 * This module should be included on pages that need session-aware navbar behavior.
 */

import { onAuthChange, logoutUser, getCurrentUser } from './auth-esm.js';
import { syncUserProfile } from './user-profile.js';

/**
 * Update the navbar based on auth state
 * @param {import('firebase/auth').User | null} user - The current user
 */
function updateNavbar(user) {
  // Find navbar elements - these may be loaded asynchronously
  const accountLink = document.querySelector('.nav-account-link');
  const loginLink = document.querySelector('.nav-login-link');
  const logoutLink = document.querySelector('.nav-logout-link');
  const userInfo = document.querySelector('.nav-user-info');
  const verifyWarning = document.querySelector('.nav-verify-warning');

  if (!accountLink && !loginLink && !logoutLink) {
    // Navbar might not be loaded yet, retry after a short delay
    return;
  }

  if (user) {
    // User is signed in
    if (loginLink) loginLink.style.display = 'none';
    if (accountLink) accountLink.style.display = '';
    if (logoutLink) logoutLink.style.display = '';

    // Show user info (email or display name)
    if (userInfo) {
      userInfo.textContent = user.displayName || user.email || '';
      userInfo.style.display = '';
    }

    // Show verification warning if not verified
    if (verifyWarning) {
      verifyWarning.style.display = user.emailVerified ? 'none' : '';
    }

    // Sync profile in background
    syncUserProfile(user).catch(console.error);
  } else {
    // User is signed out
    if (loginLink) loginLink.style.display = '';
    if (accountLink) accountLink.style.display = 'none';
    if (logoutLink) logoutLink.style.display = 'none';
    if (userInfo) userInfo.style.display = 'none';
    if (verifyWarning) verifyWarning.style.display = 'none';
  }
}

/**
 * Handle logout button click
 * @param {Event} e - The click event
 */
async function handleLogout(e) {
  e.preventDefault();

  try {
    await logoutUser();
    // Redirect to home after logout
    window.location.href = '/index.html';
  } catch (error) {
    console.error('Error signing out:', error);
    alert('Error al cerrar sesión. Intenta de nuevo.');
  }
}

/**
 * Set up logout button handlers
 */
function setupLogoutHandlers() {
  // Find all logout buttons/links
  const logoutButtons = document.querySelectorAll('.nav-logout-link, [data-action="logout"]');
  logoutButtons.forEach((button) => {
    button.addEventListener('click', handleLogout);
  });
}

/**
 * Wait for navbar to be loaded and then update it
 */
function waitForNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  // Use MutationObserver to detect when navbar content is loaded
  const observer = new MutationObserver((mutations, obs) => {
    const navLinks = navbar.querySelector('.nav-links');
    if (navLinks) {
      obs.disconnect();
      // Navbar is loaded, update it with current user state
      const user = getCurrentUser();
      updateNavbar(user);
      setupLogoutHandlers();
    }
  });

  observer.observe(navbar, { childList: true, subtree: true });

  // Also check immediately in case navbar is already loaded
  const navLinks = navbar.querySelector('.nav-links');
  if (navLinks) {
    observer.disconnect();
    const user = getCurrentUser();
    updateNavbar(user);
    setupLogoutHandlers();
  }
}

/**
 * Initialize the session listener
 */
function init() {
  // Listen for auth state changes
  onAuthChange((user) => {
    updateNavbar(user);
    setupLogoutHandlers();
  });

  // Wait for navbar to be loaded (it's fetched asynchronously)
  waitForNavbar();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Export for use in other modules if needed
export { updateNavbar, handleLogout };
