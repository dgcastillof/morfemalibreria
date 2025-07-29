import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import {
  getFirestore,
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import config from './firebase-config.js';

let app;
let db;

export function init() {
  if (!app) {
    app = initializeApp(config);
    db = getFirestore(app);
  }
  return db;
}

export async function loadComments(slug) {
  const database = db || init();
  const q = query(collection(database, 'reviews', slug, 'comments'), orderBy('createdAt'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data());
}

export async function addComment(slug, name, message, recaptchaToken) {
  const database = db || init();
  const data = {
    name: String(name),
    message: String(message),
    createdAt: serverTimestamp()
  };
  if (recaptchaToken) data.recaptchaToken = recaptchaToken;
  return addDoc(collection(database, 'reviews', slug, 'comments'), data);
}

export async function initComments(slug) {
  const form = document.getElementById("comment-form");
  const list = document.getElementById("comment-list");

  if (!form || !list) {
    console.warn("Formulario o lista de comentarios no encontrados");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = form.elements["name"].value;
    const message = form.elements["message"].value;

    try {
      await addComment(slug, name, message);
      form.reset();
      const item = document.createElement("li");
      item.textContent = `${name}: ${message}`;
      list.appendChild(item);
    } catch (err) {
      console.error("Error al enviar comentario:", err);
    }
  });

  try {
    const comments = await loadComments(slug);
    for (const { name, message } of comments) {
      const item = document.createElement("li");
      item.textContent = `${name}: ${message}`;
      list.appendChild(item);
    }
  } catch (err) {
    console.error("Error al cargar comentarios:", err);
  }
}
