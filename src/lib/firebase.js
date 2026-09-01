const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// True once a real config is present. Otherwise we fall back to local-only mode.
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId
);

// Lazy singleton: the Firebase SDK is only loaded when a real config exists.
// Keeps the demo-mode bundle small (no auth/firestore SDK) and avoids any
// network/token work in local-only mode.
let firebasePromise = null;

export function getFirebase() {
  if (!isFirebaseConfigured) return null;
  if (!firebasePromise) {
    firebasePromise = Promise.all([
      import('firebase/app'),
      import('firebase/auth'),
      import('firebase/firestore'),
    ]).then(([{ initializeApp }, { getAuth }, { getFirestore }]) => {
      const app = initializeApp(firebaseConfig);
      return {
        app,
        auth: getAuth(app),
        db: getFirestore(app),
      };
    });
  }
  return firebasePromise;
}