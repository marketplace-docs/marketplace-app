
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { logActivity } from '@/lib/logger';

type User = {
  id: number;
  email: string;
  name: string;
  role: string;
};

type MenuPermissions = {
  [menuHref: string]: boolean;
};

type AuthContextType = {
  user: User | null;
  permissions: MenuPermissions | null;
  login: (credentials: { email: string; password?: string }) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<MenuPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = async (userId: number) => {
    try {
        const response = await fetch(`/api/menu-permissions/${userId}`);
        if (!response.ok) {
            console.error("Failed to fetch permissions, using defaults.");
            return null;
        }
        const data: { menu_href: string, is_accessible: boolean }[] = await response.json();
        const perms = data.reduce((acc, p) => {
            acc[p.menu_href] = p.is_accessible;
            return acc;
        }, {} as MenuPermissions);

        // If no permissions are returned from DB, default to all true
        if (Object.keys(perms).length === 0) {
            return null; // Let the app default all to true
        }

        return perms;
    } catch (error) {
        console.error("Error fetching permissions:", error);
        return null;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
        try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const parsedUser: User = JSON.parse(storedUser);
                setUser(parsedUser);
                const userPermissions = await fetchPermissions(parsedUser.id);
                setPermissions(userPermissions);
            }
        } catch (error) {
            console.error("Failed to parse user from localStorage", error);
            localStorage.removeItem('user');
        } finally {
            setLoading(false);
        }
    };
    initializeAuth();
  }, []);

  const login = async (credentials: { email: string; password?: string }): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      const loggedInUser: User = data.user;
      setUser(loggedInUser);
      localStorage.setItem('user', JSON.stringify(loggedInUser));

      const userPermissions = await fetchPermissions(loggedInUser.id);
      setPermissions(userPermissions);


      await logActivity({
        userName: loggedInUser.name,
        userEmail: loggedInUser.email,
        action: 'LOGIN',
        details: 'User logged in successfully.',
      });

      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
        setLoading(false);
    }
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
    setPermissions(null);
    localStorage.removeItem('user');
    localStorage.removeItem('permissions'); // Clean up old if any
  };

  const value = { user, permissions, login, logout, loading };

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
