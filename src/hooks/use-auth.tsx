
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { logActivity } from '@/lib/logger';
import { NAV_LINKS } from '@/lib/constants';

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

// Helper to generate a flat list of all possible menu hrefs and group identifiers
const getAllMenuHrefs = (links: typeof NAV_LINKS): string[] => {
    const hrefs: string[] = [];
    const traverse = (navLinks: typeof NAV_LINKS) => {
        navLinks.forEach(link => {
            const effectiveHref = link.children ? `group-${link.label}` : link.href;
            hrefs.push(effectiveHref);
            if (link.children) {
                traverse(link.children);
            }
        });
    };
    traverse(links);
    return hrefs;
};
const allMenuHrefs = getAllMenuHrefs(NAV_LINKS);


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<MenuPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = async (userId: number) => {
    // Default to all permissions granted
    const defaultPermissions = allMenuHrefs.reduce((acc, href) => {
        acc[href] = true;
        return acc;
    }, {} as MenuPermissions);

    try {
        const response = await fetch(`/api/menu-permissions/${userId}`);
        if (!response.ok) {
            console.error("Failed to fetch permissions, using default (all allowed).");
            return defaultPermissions;
        }
        const data: { menu_href: string, is_accessible: boolean }[] = await response.json();
        
        // If DB returns no specific rules for the user, they get full access.
        if (data.length === 0) {
            return defaultPermissions;
        }

        const userPermissions = { ...defaultPermissions };
        data.forEach(p => {
            if (p.menu_href in userPermissions) {
                userPermissions[p.menu_href] = p.is_accessible;
            }
        });

        return userPermissions;

    } catch (error) {
        console.error("Error fetching permissions, using default (all allowed):", error);
        return defaultPermissions; // Fallback to all permissions on error
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
