import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminUser } from '../types';

interface AuthContextType {
  currentUser: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  updateAdminPassword: (currentPass: string, newPass: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_ADMIN_KEY = 'sixate_admin_session_v1';

// Hardcoded admin credentials (no Firebase Auth — simple UI gate)
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'sixate@68';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage on app start
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_ADMIN_KEY);
      if (saved) {
        setCurrentUser(JSON.parse(saved));
      }
    } catch {
      setCurrentUser(null);
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, pass: string): Promise<void> => {
    const cleanUsername = username.trim().toLowerCase();

    if (cleanUsername === ADMIN_USERNAME && pass === ADMIN_PASSWORD) {
      const adminData: AdminUser = {
        uid: 'sixate-admin-1',
        email: 'admin@sixate.edu',
        role: 'super_admin',
        name: 'Administrator'
      };
      setCurrentUser(adminData);
      localStorage.setItem(LOCAL_ADMIN_KEY, JSON.stringify(adminData));
      return;
    }

    throw new Error('Invalid username or password. Please try again.');
  };

  const logout = async (): Promise<void> => {
    setCurrentUser(null);
    localStorage.removeItem(LOCAL_ADMIN_KEY);
  };

  const updateAdminPassword = async (_currentPass: string, _newPass: string): Promise<void> => {
    // Password updates are not supported in the hardcoded credential model.
    throw new Error('Password changes are managed by the system administrator.');
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
