'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore'

/**
 * Initializes Firebase using the provided configuration.
 * Includes safety checks to prevent crashes if API keys are missing.
 * Includes safety checks to prevent crashes if API keys are missing.
 */
export function initializeFirebase() {
  try {
    const isConfigValid = !!firebaseConfig.apiKey && firebaseConfig.apiKey !== "undefined" && firebaseConfig.apiKey !== "";
    
    if (!isConfigValid) {
      console.warn("Firebase configuration is missing or invalid. Check your .env file.");
      // Return a minimal shape to prevent immediate runtime crashes, though services will fail if called.
      return {
        firebaseApp: null as any,
        auth: null as any,
        firestore: null as any
      };
    }

    if (!getApps().length) {
      const firebaseApp = initializeApp(firebaseConfig);
      return getSdks(firebaseApp);
    }

    return getSdks(getApp());
  } catch (error) {
    console.error("Firebase failed to initialize:", error);
    return {
      firebaseApp: null as any,
      auth: null as any,
      firestore: null as any
    };
  }
}

export function getSdks(firebaseApp: FirebaseApp) {
  if (!firebaseApp) return { firebaseApp: null as any, auth: null as any, firestore: null as any };
  
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
