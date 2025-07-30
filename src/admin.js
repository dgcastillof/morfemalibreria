import {
  init,
  loadPendingComments,
  approveComment,
  deleteComment,
} from './comments-esm.js';

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  if (!slug) {
    document.getElementById('pending-list').textContent =
      'Falta el parametro slug';
    return;
  }

  await init();
  const list = document.getElementById('pending-list');
  try {
    const comments = await loadPendingComments(slug);
    for (const { id, name, message } of comments) {
      const li = document.createElement('li');
      li.textContent = `${name}: ${message} `;
      const approveBtn = document.createElement('button');
      approveBtn.textContent = 'Aprobar';
      approveBtn.addEventListener('click', async () => {
        await approveComment(slug, id);
        li.remove();
      });
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Eliminar';
      deleteBtn.addEventListener('click', async () => {
        await deleteComment(slug, id);
        li.remove();
      });
      li.appendChild(approveBtn);
      li.appendChild(deleteBtn);
      list.appendChild(li);
    }
  } catch (err) {
    console.error('Error cargando comentarios pendientes', err);
  }
});
