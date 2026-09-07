import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { doc, getDoc, setDoc, getFirestore } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { db, auth, firebaseConfig } from '../lib/firebase';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';

// Firebase's email/password provider requires an email, but the phone-based
// login is meant to need nothing but name + phone + password (no real email
// the client has to remember). We synthesize a fake, never-emailed address
// from the phone digits under a reserved-looking internal domain so it
// still satisfies Firebase's format check.
const PHONE_AUTH_DOMAIN = 'sg-phone.internal';
const normalizePhoneDigits = (phone: string) => phone.replace(/\D/g, '');
const phoneToPseudoEmail = (phone: string) => `${normalizePhoneDigits(phone)}@${PHONE_AUTH_DOMAIN}`;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  loginWithPhone: (phone: string, pass: string) => Promise<void>;
  registerWithPhone: (name: string, phone: string, pass: string) => Promise<void>;
  loginWithSocial: (providerName: 'google' | 'facebook') => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
  resendVerification: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loginWithGoogle: async () => {},
  loginWithEmail: async () => {},
  registerWithEmail: async () => {},
  loginWithPhone: async () => {},
  registerWithPhone: async () => {},
  loginWithSocial: async () => {},
  logout: () => {},
  updateUser: async () => {},
  resendVerification: async () => {},
  resetPassword: async () => {},
  refreshUser: async () => {}
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Set browser local persistence for automatic seamless login
  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.warn('Persistence setup warning:', err);
    });
  }, []);

  // Sync user from Firestore
  const syncUserFromFirestore = async (firebaseUser: FirebaseUser) => {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    let userData: User;
    const email = firebaseUser.email || '';
    const isOwner = email === 'michelgeminicriador@gmail.com' || email === 'felixcastroadv@gmail.com';

    if (userSnap.exists()) {
      const data = userSnap.data();
      const currentRole = data.role || 'user';
      const shouldBeAdmin = isOwner && currentRole !== 'admin';
      
      userData = { 
        ...data, 
        uid: firebaseUser.uid, 
        email: email,
        name: data.name || firebaseUser.displayName || 'Usuário',
        role: isOwner ? 'admin' : currentRole
      } as User;

      if (shouldBeAdmin) {
        await setDoc(userRef, userData, { merge: true });
      }
    } else {
      const role = isOwner ? 'admin' : 'user';
      userData = {
        uid: firebaseUser.uid,
        email: email,
        name: firebaseUser.displayName || 'Usuário Google',
        role,
        createdAt: Date.now()
      };
      await setDoc(userRef, userData);
    }

    // Google accounts or authenticated sessions are set as verified
    const isEmailVerified = firebaseUser.emailVerified || firebaseUser.providerData.some(p => p.providerId === 'google.com') || true;
    const finalUser = { ...userData, emailVerified: isEmailVerified };
    setUser(finalUser);
    return finalUser;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          await syncUserFromFirestore(firebaseUser);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Error in onAuthStateChanged:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      await setPersistence(auth, browserLocalPersistence);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      await syncUserFromFirestore(result.user);
    } catch (err) {
      console.error('Error logging in with Google:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const registerWithPhone = async (name: string, phone: string, pass: string) => {
    setLoading(true);
    const digits = normalizePhoneDigits(phone);
    if (digits.length < 10) {
      setLoading(false);
      throw new Error('Informe um telefone válido com DDD.');
    }

    // Runs on an isolated secondary Firebase app instance so creating this
    // account never touches the primary `auth` session. If it did, the
    // global onAuthStateChanged listener would briefly log this browser in
    // as the brand-new account, which would skip past the "conta criada,
    // agora faça login" confirmation screen the owner asked for.
    const secondaryApp = initializeApp(firebaseConfig, `phone-register-${Date.now()}`);
    try {
      const secondaryAuth = getAuth(secondaryApp);
      const secondaryDb = getFirestore(secondaryApp, firebaseConfig.firestoreDatabaseId);
      const cred = await createUserWithEmailAndPassword(secondaryAuth, phoneToPseudoEmail(digits), pass);
      await updateProfile(cred.user, { displayName: name });

      const userData: User = {
        uid: cred.user.uid,
        email: '',
        name,
        phone: digits,
        role: 'user',
        createdAt: Date.now()
      };
      await setDoc(doc(secondaryDb, 'users', cred.user.uid), userData);
      await signOut(secondaryAuth);
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        throw new Error('Já existe uma conta com esse número de telefone. Tente entrar em vez de criar uma nova conta.');
      }
      if (err.code === 'auth/weak-password') {
        throw new Error('A senha precisa ter pelo menos 6 caracteres.');
      }
      throw err;
    } finally {
      await deleteApp(secondaryApp).catch(() => {});
      setLoading(false);
    }
  };

  const loginWithPhone = async (phone: string, pass: string) => {
    setLoading(true);
    try {
      const digits = normalizePhoneDigits(phone);
      await setPersistence(auth, browserLocalPersistence);
      const cred = await signInWithEmailAndPassword(auth, phoneToPseudoEmail(digits), pass);
      await syncUserFromFirestore(cred.user);
    } catch (err: any) {
      if (['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found'].includes(err.code)) {
        throw new Error('Telefone ou senha incorretos.');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Backward compatibility stubs
  const loginWithSocial = async (_providerName: 'google' | 'facebook') => {
    await loginWithGoogle();
  };

  const loginWithEmail = async () => {
    throw new Error('O login por e-mail e senha foi desativado. Por favor, utilize o login com o Google.');
  };

  const registerWithEmail = async () => {
    throw new Error('O cadastro por e-mail e senha foi desativado. Por favor, utilize o login com o Google.');
  };

  const resendVerification = async () => {};
  const resetPassword = async () => {};

  const refreshUser = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      await syncUserFromFirestore(auth.currentUser);
    }
  };

  const logout = () => {
    signOut(auth).catch(err => console.error('Error signing out:', err));
  };

  const updateUser = async (data: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...data };
      setUser(updated);
      try {
        await setDoc(doc(db, 'users', user.uid), updated, { merge: true });
      } catch (err) {
        console.error('Failed to sync updated user:', err);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      loginWithGoogle,
      loginWithEmail,
      registerWithEmail,
      loginWithPhone,
      registerWithPhone,
      loginWithSocial,
      logout, 
      updateUser,
      resendVerification,
      resetPassword,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

