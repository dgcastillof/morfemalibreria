/**
 * User Profile Module
 *
 * Handles Firestore operations for user profiles in the `users/{uid}` collection.
 * Uses the shared Firebase app and Firestore instance from firebase-app.js.
 *
 * Profile document schema:
 * - displayName: string (required, min 2 chars)
 * - emailVerified: boolean
 * - createdAt: Timestamp (set once on creation)
 * - updatedAt: Timestamp (updated on every sync)
 * 
 * Note: email is stored in Firebase Auth, not duplicated in Firestore.
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { db } from './firebase-app.js';

/**
 * Get a user profile from Firestore.
 *
 * @param {string} uid - The user's UID
 * @returns {Promise<Object|null>} The profile data or null if not found
 */
export async function getUserProfile(uid) {
  if (!uid) return null;

  try {
    const docRef = doc(db, 'users', uid);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? snapshot.data() : null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

/**
 * Create a new user profile in Firestore.
 * Should be called after successful registration.
 *
 * @param {import('firebase/auth').User} user - The Firebase Auth user object
 * @param {Object} [additionalData] - Additional profile data (e.g., displayName)
 * @returns {Promise<void>}
 */
export async function createUserProfile(user, additionalData = {}) {
  if (!user || !user.uid) {
    throw new Error('User object with UID is required');
  }

  const docRef = doc(db, 'users', user.uid);

  // Use provided displayName, or Firebase Auth displayName, or extract from email
  let displayName = additionalData.displayName || user.displayName || '';
  if (!displayName && user.email) {
    // Extract username from email as fallback (e.g., "john" from "john@example.com")
    displayName = user.email.split('@')[0];
  }
  // Ensure minimum length of 2 characters
  if (displayName.length < 2) {
    displayName = 'Usuario';
  }

  const profileData = {
    emailVerified: user.emailVerified || false,
    displayName: displayName,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(docRef, profileData);
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
}

/**
 * Update an existing user profile in Firestore.
 * Only updates the fields provided, plus always updates `updatedAt`.
 *
 * @param {string} uid - The user's UID
 * @param {Object} data - The fields to update
 * @returns {Promise<void>}
 */
export async function updateUserProfile(uid, data) {
  if (!uid) {
    throw new Error('User UID is required');
  }

  const docRef = doc(db, 'users', uid);

  try {
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

/**
 * Sync the user profile with current auth state.
 * Creates the profile if it doesn't exist, or updates emailVerified if changed.
 *
 * @param {import('firebase/auth').User} user - The Firebase Auth user object
 * @returns {Promise<void>}
 */
export async function syncUserProfile(user) {
  if (!user || !user.uid) return;

  try {
    const existingProfile = await getUserProfile(user.uid);

    if (!existingProfile) {
      // Profile doesn't exist, create it
      await createUserProfile(user);
    } else if (existingProfile.emailVerified !== user.emailVerified) {
      // Update emailVerified status if it changed
      await updateUserProfile(user.uid, {
        emailVerified: user.emailVerified,
      });
    }
  } catch (error) {
    console.error('Error syncing user profile:', error);
    // Don't throw - this is a background operation
  }
}
