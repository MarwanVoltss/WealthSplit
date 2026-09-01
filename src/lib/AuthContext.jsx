import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './firebase';

const DEMO_USER_KEY = 'wealthsplit-demo-user';
const DEMO_DATA_KEY = 'wealthsplit-data';
const REMEMBER_KEY = 'wealthsplit-remember';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // { loading: true } OR { loading: false, data } — user data for the data store
  const [userData, setUserData] = useState({ loading: true, data: null });

  // ---- Auth state listener (only in Firebase mode) ----
  useEffect(() => {
    if (!isFirebaseConfigured) {
      // Demo/local mode: restore a locally stored demo user if present
      const demo = localStorage.getItem(DEMO_USER_KEY);
      if (demo) {
        try { setUser(JSON.parse(demo)); } catch { setUser(null); }
      }
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        setUser({ uid: fbUser.uid, email: fbUser.email, name: fbUser.displayName || fbUser.email });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  // ---- Load user's saved data (Firestore) ----
  useEffect(() => {
    if (!user) {
      setUserData({ loading: false, data: null });
      return;
    }

    if (!isFirebaseConfigured) {
      // Local mode: read from localStorage
      let data = null;
      try {
        const saved = localStorage.getItem(DEMO_DATA_KEY);
        data = saved ? JSON.parse(saved) : null;
      } catch { data = null; }
      setUserData({ loading: false, data });
      return;
    }

    const docRef = doc(db, 'users', user.uid);
    setUserData({ loading: true, data: null });
    const unsub = onSnapshot(docRef, (snap) => {
      const data = snap.exists() ? snap.data() : null;
      setUserData({ loading: false, data });
    });
    return unsub;
  }, [user]);

  // ---- Save user data ----
  const saveData = useCallback((updater) => {
    if (!user) return;
    // Compute next value from current
    setUserData((prev) => {
      const next = typeof updater === 'function' ? updater(prev.data) : updater;
      const payload = { ...prev, data: next };

      if (!isFirebaseConfigured) {
        try { localStorage.setItem(DEMO_DATA_KEY, JSON.stringify(next)); } catch {}
        return payload;
      }

      // Firestore write (fire-and-forget, debounced by caller)
      const docRef = doc(db, 'users', user.uid);
      setDoc(docRef, next, { merge: true })
        .catch(() => {});
      return payload;
    });
  }, [user]);

  // ---- Auth actions ----
  const recallCredentials = useCallback(() => {
    try {
      const raw = localStorage.getItem(REMEMBER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }, []);

  // Persist entered credentials so the user never re-types them.
  const rememberCredentials = useCallback((email, password) => {
    try { localStorage.setItem(REMEMBER_KEY, JSON.stringify({ email, password })); } catch {}
  }, []);

  const clearRemembered = useCallback(() => {
    try { localStorage.removeItem(REMEMBER_KEY); } catch {}
  }, []);

  const signUp = async (email, password) => {
    rememberCredentials(email, password);
    if (!isFirebaseConfigured) {
      // Demo: fake a local user so the flow is testable without Firebase
      const demoUser = { uid: 'demo', email, name: email };
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser));
      setUser(demoUser);
      return demoUser;
    }
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    return { uid: cred.user.uid, email: cred.user.email, name: cred.user.displayName || cred.user.email };
  };

  const logIn = async (email, password) => {
    rememberCredentials(email, password);
    if (!isFirebaseConfigured) {
      const demoUser = { uid: 'demo', email, name: email };
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser));
      setUser(demoUser);
      return demoUser;
    }
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return { uid: cred.user.uid, email: cred.user.email, name: cred.user.displayName || cred.user.email };
  };

  const logOut = async () => {
    // Keep remembered credentials so the fields are pre-filled next time.
    if (!isFirebaseConfigured) {
      localStorage.removeItem(DEMO_USER_KEY);
      setUser(null);
      return;
    }
    await signOut(auth);
  };

  const value = {
    user,
    loading,
    userData,
    saveData,
    signUp,
    logIn,
    logOut,
    recallCredentials,
    rememberCredentials,
    clearRemembered,
    isFirebaseConfigured,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
