import {
  init,
  loadPendingComments,
  approveComment,
  deleteComment,
} from './comments-esm.js';
import { onAuthChange, logoutUser, getAdminClaim } from './auth-esm.js';

// DOM elements
const loadingState = document.getElementById('loading-state');
const accessDenied = document.getElementById('access-denied');
const adminContent = document.getElementById('admin-content');
const logoutBtn = document.getElementById('logout-btn');
const pendingList = document.getElementById('pending-list');

/**
 * Show the appropriate UI state based on authentication/authorization.
 * @param {'loading' | 'denied' | 'authorized'} state
 */
function showState(state) {
  loadingState.style.display = state === 'loading' ? 'block' : 'none';
  accessDenied.style.display = state === 'denied' ? 'block' : 'none';
  adminContent.style.display = state === 'authorized' ? 'block' : 'none';
}

/**
 * Load and render pending comments for the given slug.
 * @param {string} slug
 */
async function renderPendingComments(slug) {
  pendingList.innerHTML = '';
  try {
    const comments = await loadPendingComments(slug);
    if (comments.length === 0) {
      pendingList.innerHTML = '<li>No hay comentarios pendientes.</li>';
      return;
    }
    for (const { id, name, message } of comments) {
      const li = document.createElement('li');
      li.textContent = `${name}: ${message} `;

      const approveBtn = document.createElement('button');
      approveBtn.textContent = 'Aprobar';
      approveBtn.addEventListener('click', async () => {
        approveBtn.disabled = true;
        try {
          await approveComment(slug, id);
          li.remove();
        } catch (err) {
          console.error('Error aprobando comentario', err);
          approveBtn.disabled = false;
        }
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Eliminar';
      deleteBtn.addEventListener('click', async () => {
        deleteBtn.disabled = true;
        try {
          await deleteComment(slug, id);
          li.remove();
        } catch (err) {
          console.error('Error eliminando comentario', err);
          deleteBtn.disabled = false;
        }
      });

      li.appendChild(approveBtn);
      li.appendChild(deleteBtn);
      pendingList.appendChild(li);
    }
  } catch (err) {
    console.error('Error cargando comentarios pendientes', err);
    pendingList.innerHTML = '<li>Error al cargar comentarios.</li>';
  }
}

// Initialize auth listener and admin verification
let unsubscribeAuth = null;
let isInitialized = false;

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');

  if (!slug) {
    showState('authorized');
    pendingList.textContent = 'Falta el parámetro slug';
    return;
  }

  // Set up logout button
  logoutBtn.addEventListener('click', async () => {
    logoutBtn.disabled = true;
    try {
      await logoutUser();
      // Auth state change will handle redirect
    } catch (err) {
      console.error('Error al cerrar sesión', err);
      logoutBtn.disabled = false;
    }
  });

  // Listen for auth state changes
  unsubscribeAuth = onAuthChange(async (user) => {
    if (!user) {
      showState('denied');
      return;
    }

    // Verify admin claim
    const isAdmin = await getAdminClaim();
    if (!isAdmin) {
      showState('denied');
      return;
    }

    // User is authenticated and is admin
    showState('authorized');

    // Only load comments once
    if (!isInitialized) {
      isInitialized = true;
      await init();
      await renderPendingComments(slug);
    }
  });
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (unsubscribeAuth) {
    unsubscribeAuth();
  }
});
