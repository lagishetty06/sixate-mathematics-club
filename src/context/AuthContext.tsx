import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminUser } from '../types';
import { auth, seedAdminUserDocument } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged, updatePassword } from 'firebase/auth';

interface AuthContextType {
  currentUser: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  updateAdminPassword: (currentPass: string, newPass: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_ADMIN_KEY = 'sixate_admin_session_v1';
const LOCAL_CUSTOM_PASS_KEY = 'sixate_custom_admin_password';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_ADMIN_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const role = user.email === 'superadmin@sixate.edu' ? 'super_admin' : 'admin';
        const adminData: AdminUser = {
          uid: user.uid,
          email: user.email || 'admin@sixate.edu',
          role: role,
          name: user.displayName || user.email?.split('@')[0] || 'Administrator'
        };
        setCurrentUser(adminData);
        localStorage.setItem(LOCAL_ADMIN_KEY, JSON.stringify(adminData));
        // Seed admins/{uid} document in Firestore for this Firebase Auth user
        await seedAdminUserDocument(user.uid, user.email || 'admin@sixate.edu', role);
      } else {
        const saved = localStorage.getItem(LOCAL_ADMIN_KEY);
        if (saved) {
          try {
            setCurrentUser(JSON.parse(saved));
          } catch {
            setCurrentUser(null);
          }
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    
    // Try Firebase Auth login, or auto-register on first use
    try {
      let userUid: string | null = null;
      try {
        console.log('[SIXATE] Attempting Firebase signInWithEmailAndPassword for:', cleanEmail);
        const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
        userUid = cred.user.uid;
        console.log('[SIXATE] Firebase sign-in SUCCESS. UID:', userUid);
      } catch (err: any) {
        console.warn('[SIXATE] signIn failed, code:', err.code, 'message:', err.message);
        // Firebase v9+ uses 'auth/invalid-credential' when user doesn't exist
        const notFound = err.code === 'auth/user-not-found'
          || err.code === 'auth/invalid-credential'
          || err.code === 'auth/invalid-email';
        if (notFound) {
          console.log('[SIXATE] User not found — creating account in Firebase Auth...');
          const newCred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
          userUid = newCred.user.uid;
          console.log('[SIXATE] Firebase createUser SUCCESS. UID:', userUid);
        } else {
          // Wrong password or other real error — do NOT fall through to localStorage
          setIsLoading(false);
          throw new Error('Firebase Auth error: ' + (err.message || err.code));
        }
      }

      if (userUid) {
        const role = cleanEmail.includes('super') ? 'super_admin' : 'admin';
        const adminData: AdminUser = {
          uid: userUid,
          email: cleanEmail,
          role: role,
          name: cleanEmail.split('@')[0] || 'Admin'
        };
        setCurrentUser(adminData);
        localStorage.setItem(LOCAL_ADMIN_KEY, JSON.stringify(adminData));
        await seedAdminUserDocument(userUid, cleanEmail, role);
        setIsLoading(false);
        return;
      }
    } catch (e: any) {
      // Only reach here if createUserWithEmailAndPassword also failed
      console.error('[SIXATE] Firebase Auth FAILED entirely:', e.code, e.message);
      setIsLoading(false);
      throw new Error(e.message || 'Authentication failed. Please try again.');
    }

    // Check custom updated password or seed fallback
    const customPass = localStorage.getItem(LOCAL_CUSTOM_PASS_KEY) || 'sixate2026';
    if (pass === customPass || pass === 'sixate2026' || (cleanEmail === 'admin@sixate.edu' && pass === 'admin123')) {
      const adminData: AdminUser = {
        uid: 'fallback-admin-uid-1',
        email: cleanEmail,
        role: cleanEmail.startsWith('super') ? 'super_admin' : 'admin',
        name: cleanEmail.split('@')[0].toUpperCase() || 'Admin'
      };
      setCurrentUser(adminData);
      localStorage.setItem(LOCAL_ADMIN_KEY, JSON.stringify(adminData));
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    throw new Error('Invalid email or password. Please check your credentials.');
  };

  const updateAdminPassword = async (currentPass: string, newPass: string) => {
    setIsLoading(true);
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPass);
      } else {
        const validPass = localStorage.getItem(LOCAL_CUSTOM_PASS_KEY) || 'sixate2026';
        if (currentPass !== validPass && currentPass !== 'sixate2026') {
          throw new Error('Current password does not match our records.');
        }
        localStorage.setItem(LOCAL_CUSTOM_PASS_KEY, newPass);
      }
    } catch (err: any) {
      setIsLoading(false);
      throw new Error(err.message || 'Failed to update password.');
    }
    setIsLoading(false);
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn('Firebase logout warning:', e);
    }
    setCurrentUser(null);
    localStorage.removeItem(LOCAL_ADMIN_KEY);
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      isAuthenticated: !!currentUser,
      isLoading,
      login,
      logout,
      updateAdminPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
