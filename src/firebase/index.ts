'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

/**
 * Initializes Firebase using the provided configuration.
 * Includes safety checks to prevent crashes if API keys are missing.
 */
export function initializeFirebase() {
  try {
    const isConfigValid = !!firebaseConfig.apiKey && firebaseConfig.apiKey !== "undefined";
    
    if (!isConfigValid) {
      console.warn("Firebase configuration is missing or invalid. Check your .env file.");
    }

    if (!getApps().length) {
      const firebaseApp = initializeApp(firebaseConfig);
      return getSdks(firebaseApp);
    }

    return getSdks(getApp());
  } catch (error) {
    console.error("Firebase failed to initialize:", error);
    // Return dummy initialized app to prevent cascading runtime errors
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    return getSdks(app);
  }
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
