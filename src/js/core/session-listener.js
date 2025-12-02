/**
 * Session Listener Module
 *
 * Provides global auth state awareness for the navbar and other account sections.
 * Updates the UI based on whether the user is signed in, and their verification status.
 *
 * This module should be included on pages that need session-aware navbar behavior.
 */

import { onAuthChange, logoutUser, getCurrentUser } from './auth-esm.js';
import { syncUserProfile, getUserProfile } from './user-profile.js';

// LocalStorage key for caching user display name
const CACHED_USER_KEY = 'morfema_cached_user';

// Track if handlers are set up to avoid duplicates
let dropdownHandlersSetup = false;
let logoutHandlersSetup = false;

/**
 * Get cached user data from localStorage
 */
function getCachedUser() {
  try {
    const cached = localStorage.getItem(CACHED_USER_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

/**
 * Save user data to localStorage cache
 */
function setCachedUser(user) {
  try {
    if (user) {
      localStorage.setItem(CACHED_USER_KEY, JSON.stringify({
        displayName: user.displayName,
        email: user.email,
        emailVerified: user.emailVerified
      }));
    } else {
      localStorage.removeItem(CACHED_USER_KEY);
    }
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Remove auth-pending class from navbar to reveal auth elements
 */
function revealAuthElements() {
  const navbar = document.querySelector('.navbar.auth-pending');
  if (navbar) {
    navbar.classList.remove('auth-pending');
  }
}

/**
 * Update the navbar based on auth state
 * @param {import('firebase/auth').User | null} user - The current user
 * @param {boolean} fromCache - Whether this update is from cached data
 */
async function updateNavbar(user, fromCache = false) {
  // Find navbar elements
  const accountLink = document.querySelector('.nav-account-link');
  const loginLink = document.querySelector('.nav-login-link');
  const userDropdown = document.querySelector('.nav-user-dropdown');
  const userName = document.querySelector('.nav-user-name');
  const verifyWarning = document.querySelector('.nav-verify-warning');

  if (!accountLink && !loginLink && !userDropdown) {
    // Navbar might not be loaded yet
    return;
  }

  if (user) {
    // User is signed in
    if (loginLink) loginLink.style.display = 'none';
    if (accountLink) accountLink.style.display = '';

    // Get displayName - use cached value first, then fetch from Firestore
    let displayText = '';
    
    if (fromCache) {
      // Use cached displayName immediately
      displayText = (user.displayName || user.email || '').toUpperCase();
    } else {
      // Fetch fresh displayName from Firestore
      try {
        const profile = await getUserProfile(user.uid);
        console.log('[DEBUG] User profile from Firestore:', profile);
        console.log('[DEBUG] user.displayName:', user.displayName);
        console.log('[DEBUG] user.email:', user.email);
        displayText = (profile?.displayName || user.displayName || user.email || '').toUpperCase();
        // Update cache with fresh data
        setCachedUser({ 
          displayName: profile?.displayName || user.displayName, 
          email: user.email,
          emailVerified: user.emailVerified 
        });
      } catch (error) {
        console.error('Error getting user profile for navbar:', error);
        displayText = (user.displayName || user.email || '').toUpperCase();
      }
    }

    // Show user dropdown with display name
    if (userDropdown) {
      if (userName) userName.textContent = displayText;
      userDropdown.style.display = '';
    }

    // Show verification warning if not verified
    if (verifyWarning) {
      verifyWarning.style.display = user.emailVerified ? 'none' : '';
    }

    // Sync profile in background (only on real auth, not cache)
    if (!fromCache) {
      syncUserProfile(user).catch(console.error);
    }
  } else {
    // User is signed out - clear cache
    setCachedUser(null);
    if (loginLink) loginLink.style.display = '';
    if (accountLink) accountLink.style.display = 'none';
    if (userDropdown) userDropdown.style.display = 'none';
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
  if (logoutHandlersSetup) return;
  
  // Find all logout buttons/links
  const logoutButtons = document.querySelectorAll('.nav-logout-link, [data-action="logout"]');
  if (logoutButtons.length === 0) return;
  
  logoutButtons.forEach((button) => {
    button.addEventListener('click', handleLogout);
  });
  
  logoutHandlersSetup = true;
}

/**
 * Set up dropdown toggle for user menu
 */
function setupDropdownToggle() {
  if (dropdownHandlersSetup) return;
  
  const userToggle = document.querySelector('.nav-user-toggle');
  const userDropdown = document.querySelector('.nav-user-dropdown');
  
  if (!userToggle || !userDropdown) return;
  
  dropdownHandlersSetup = true;
  
  userToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = userDropdown.classList.toggle('open');
    userToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!userDropdown.contains(e.target)) {
      userDropdown.classList.remove('open');
      userToggle.setAttribute('aria-expanded', 'false');
    }
  });
  
  // Close dropdown on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && userDropdown.classList.contains('open')) {
      userDropdown.classList.remove('open');
      userToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

/**
 * Apply cached user state immediately for instant UI feedback
 */
function applyCachedState() {
  const cached = getCachedUser();
  if (cached) {
    // Show cached user state immediately
    updateNavbar(cached, true);
  }
  // Reveal auth elements after applying cached state (or showing login link)
  revealAuthElements();
  setupLogoutHandlers();
  setupDropdownToggle();
}

/**
 * Initialize the session listener
 */
function init() {
  // Navbar is now inline (injected at build time), apply cached state immediately
  applyCachedState();
  
  // Listen for auth state changes - this will override cached state when Firebase responds
  onAuthChange((user) => {
    updateNavbar(user, false);
    revealAuthElements(); // Ensure revealed even if not already
    setupLogoutHandlers();
    setupDropdownToggle();
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Export for use in other modules if needed
export { updateNavbar, handleLogout };
