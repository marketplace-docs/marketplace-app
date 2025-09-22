
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { logActivity } from '@/lib/logger';
import { supabaseService } from '@/lib/supabase-service';

type User = {
  email: string;
  name: string;
  role: string;
};

type AuthContextType = {
  user: User | null;
  login: (credentials: { email: string; password?: string }) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const validPassword = 'Marketplace@soco123!!!';


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  const login = async (credentials: { email: string; password?: string }): Promise<boolean> => {
    
    // Check password first
    if (credentials.password !== validPassword) {
      return false;
    }
    const lowercasedEmail = credentials.email.toLowerCase();

    // Fetch user data from the database using the service client to bypass RLS
    const { data: dbUser, error } = await supabaseService
      .from('users')
      .select('name, email, role')
      .eq('email', lowercasedEmail)
      .single();

    if (error || !dbUser) {
      console.error("Login error or user not found in DB:", error?.message);
      return false;
    }

    const loggedInUser: User = { 
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role
    };

    setUser(loggedInUser);
    localStorage.setItem('user', JSON.stringify(loggedInUser));

    await logActivity({
        userName: loggedInUser.name,
        userEmail: loggedInUser.email,
        action: 'LOGIN',
        details: 'User logged in successfully.',
    });

    return true;
  };

  const logout = async () => {
    if (user) {
        await logActivity({
            userName: user.name,
            userEmail: user.email,
            action: 'LOGOUT',
            details: 'User logged out.',
        });
    }
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
