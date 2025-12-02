/** * Centralized Firebase App Initialization * * This module provides a single
source of truth for the Firebase App instance. * All Firebase services (Auth,
Firestore, etc.) should import from here to * ensure the app is only initialized
once. * * Usage: * import { app, db } from './firebase-app.js'; * * The module
lazily initializes Firebase when first accessed and reuses * the same instance
for all subsequent imports. */ import { initializeApp, getApps, getApp } from
'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js'; import {
getFirestore } from
'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js'; import config
from './firebase-config.js'; /** * Get or create the Firebase App instance. *
Uses getApps()/getApp() to avoid duplicate initialization. * @returns
{import('firebase/app').FirebaseApp} */ function getFirebaseApp() { return
getApps().length ? getApp() : initializeApp(config); } /** The shared Firebase
App instance */ export const app = getFirebaseApp(); /** The shared Firestore
database instance */ export const db = getFirestore(app); /** Re-export the
config for modules that need direct access */ export { config as firebaseConfig
};
