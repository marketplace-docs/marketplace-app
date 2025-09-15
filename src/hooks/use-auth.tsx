
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { logActivity } from '@/lib/logger';

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

const allowedUsers: User[] = [
    { email: 'arlan.saputra@marketplace.com', name: 'Arlan Saputra', role: 'Super Admin' },
    { email: 'rudi.setiawan@marketplace.com', name: 'Rudi Setiawan', role: 'Manager' },
    { email: 'nova.aurelia@marketplace.com', name: 'Nova Aurelia', role: 'Supervisor' },
    { email: 'nurul.tanzilla@marketplace.com', name: 'Nurul Tanzilla', role: 'Admin' },
    { email: 'regina.rifana@marketplace.com', name: 'Regina Rifana', role: 'Captain' },
    { email: 'staff@marketplace.com', name: 'Staff Gudang', role: 'Staff' }
];

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
    const lowercasedEmail = credentials.email.toLowerCase();
    const foundUser = allowedUsers.find(u => u.email === lowercasedEmail);

    if (foundUser && credentials.password === validPassword) {
        const loggedInUser: User = { 
            email: foundUser.email,
            name: foundUser.name,
            role: foundUser.role
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
    }
    return false;
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

    