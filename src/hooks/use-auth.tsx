
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MainLayout } from '@/components/layout/main-layout';

type User = {
  email: string;
};

type AuthContextType = {
  user: User | null;
  login: (credentials: { email: string }) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for a logged-in user in localStorage
    try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        localStorage.removeItem('user');
    }
    setLoading(false);
  }, []);

  const login = async (credentials: { email: string }): Promise<boolean> => {
    // Simulate a real auth flow
    const loggedInUser = { email: credentials.email };
    setUser(loggedInUser);
    localStorage.setItem('user', JSON.stringify(loggedInUser));
    return true; 
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const value = { user, login, logout, loading };

  return (
    <AuthContext.Provider value={value}>
        {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
