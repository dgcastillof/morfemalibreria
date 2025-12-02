/** * Firebase Configuration * * This module exports the Firebase configuration
object used to initialize * Firebase services throughout the application. * *
Configuration values can be provided in two ways: * * 1. Environment Variables
(recommended for CI/CD): * Set these environment variables before running the
build: * - FIREBASE_API_KEY * - FIREBASE_AUTH_DOMAIN * - FIREBASE_PROJECT_ID * -
FIREBASE_STORAGE_BUCKET * - FIREBASE_MESSAGING_SENDER_ID * - FIREBASE_APP_ID * -
FIREBASE_MEASUREMENT_ID * * 2. Direct values (for local development): * Edit the
default values below with your Firebase project credentials. * * To obtain these
values: * 1. Go to the Firebase Console (https://console.firebase.google.com/) *
2. Select your project * 3. Click the gear icon > Project settings * 4. Scroll
to "Your apps" and select your web app * 5. Copy the config object values */
export default { apiKey: "AIzaSyAN2YHco-dT6uao47aEnyN_7QQ23T0JVsM", authDomain:
"morfemalibreria-b8c79.firebaseapp.com", projectId: "morfemalibreria-b8c79",
storageBucket: "morfemalibreria-b8c79.firebasestorage.app", messagingSenderId:
"324612251176", appId: "1:324612251176:web:eeb1a9a7baf5e40baddf1d",
measurementId: "G-56YKZS7WWL" };
