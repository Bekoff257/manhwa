import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile
} from 'firebase/auth';
import toast from 'react-hot-toast';
import { auth, googleProvider } from '../services/firebase';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authResolved, setAuthResolved] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (current) => {
      setAuthResolved(true);
      setFirebaseUser(current);
      if (!current) {
        setDbUser(null);
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.post('/auth/sync');
        setDbUser(data.user);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to sync user');
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  const value = useMemo(
    () => ({
      firebaseUser,
      user: dbUser,
      loading,
      authResolved,
      signup: async ({ email, password, username }) => {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        if (username) await updateProfile(credential.user, { displayName: username });
      },
      login: ({ email, password }) => signInWithEmailAndPassword(auth, email, password),
      loginWithGoogle: () => signInWithPopup(auth, googleProvider),
      logout: () => signOut(auth)
    }),
    [firebaseUser, dbUser, loading, authResolved]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
