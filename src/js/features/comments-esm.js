import { collection, query, where, orderBy, getDocs, addDoc, doc, updateDoc,
deleteDoc, serverTimestamp, } from
'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js'; import { db }
from './firebase-app.js'; import { getCurrentUser } from './auth-esm.js'; /** *
Initialize the comments module. * Returns the shared Firestore instance. *
@returns {import('firebase/firestore').Firestore} */ export function init() {
return db; } export async function loadComments(slug) { const q = query(
collection(db, 'reviews', slug, 'comments'), where('approved', '==', true),
orderBy('createdAt'), ); const snapshot = await getDocs(q); return
snapshot.docs.map((d) => d.data()); } export async function addComment(slug,
name, message, recaptchaToken) { // Get the current user to optionally attach
uid to the comment. // Anonymous visitors will have uid: null. const user =
getCurrentUser(); const uid = user ? user.uid : null; const data = { name:
String(name), message: String(message), createdAt: serverTimestamp(), approved:
false, uid: uid, }; if (recaptchaToken) data.recaptchaToken = recaptchaToken;
return addDoc(collection(db, 'reviews', slug, 'comments'), data); } export async
function loadPendingComments(slug) { const q = query( collection(db, 'reviews',
slug, 'comments'), where('approved', '==', false), orderBy('createdAt'), );
const snapshot = await getDocs(q); return snapshot.docs.map((d) => ({ id: d.id,
...d.data() })); } export async function approveComment(slug, id) { const ref =
doc(db, 'reviews', slug, 'comments', id); return updateDoc(ref, { approved: true
}); } export async function deleteComment(slug, id) { const ref = doc(db,
'reviews', slug, 'comments', id); return deleteDoc(ref); } export async function
initComments(slug) { const form = document.getElementById('comment-form'); const
list = document.getElementById('comment-list'); if (!form || !list) {
console.warn('Formulario o lista de comentarios no encontrados'); return; }
form.addEventListener('submit', async (e) => { e.preventDefault(); const name =
form.elements['name'].value; const message = form.elements['message'].value; try
{ await addComment(slug, name, message); form.reset(); alert('Comentario enviado
y pendiente de aprobación'); } catch (err) { console.error('Error al enviar
comentario:', err); } }); try { const comments = await loadComments(slug); for
(const { name, message } of comments) { const item =
document.createElement('li'); item.textContent = `${name}: ${message}`;
list.appendChild(item); } } catch (err) { console.error('Error al cargar
comentarios:', err); } }
