
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { logActivity } from '@/lib/logger';
import { NAV_LINKS, NavLink } from '@/lib/constants';

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
  login: (credentials: { email: string; name: string, password?: string }) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to generate a flat list of all possible menu hrefs and group identifiers
const getAllMenuHrefs = (links: NavLink[]): string[] => {
    const hrefs: string[] = [];
    const traverse = (navLinks: NavLink[]) => {
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

const IDLE_TIMEOUT = 3600 * 1000; // 1 hour in milliseconds
const LAST_ACTIVE_KEY = 'lastActiveTime';


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<MenuPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const idleTimer = useRef<NodeJS.Timeout>();

  const logout = useCallback(async (isIdle = false) => {
    if (user) {
        await logActivity({
            userName: user.name,
            userEmail: user.email,
            action: 'LOGOUT',
            details: isIdle ? 'User logged out due to inactivity.' : 'User logged out.',
        });
    }
    setUser(null);
    setPermissions(null);
    localStorage.removeItem('user');
    localStorage.removeItem(LAST_ACTIVE_KEY);
  }, [user]);


  const fetchPermissions = useCallback(async (userId: number) => {
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
        return defaultPermissions;
    }
  }, []);

  const resetIdleTimer = useCallback(() => {
    if (idleTimer.current) {
        clearTimeout(idleTimer.current);
    }
    idleTimer.current = setTimeout(() => {
        logout(true); // Pass true to indicate it's an idle logout
    }, IDLE_TIMEOUT);
    localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
  }, [logout]);


  useEffect(() => {
    const events = ['mousemove', 'keydown', 'scroll', 'click'];

    const handleActivity = () => {
        resetIdleTimer();
    };

    if (user) {
      // Set up activity listeners
      events.forEach(event => window.addEventListener(event, handleActivity));
      // Initialize timer
      resetIdleTimer();
    }
    
    // Cleanup
    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      if (idleTimer.current) {
        clearTimeout(idleTimer.current);
      }
    };
  }, [user, resetIdleTimer]);


  useEffect(() => {
    const initializeAuth = async () => {
        let storedUser: User | null = null;
        try {
            const storedUserJSON = localStorage.getItem('user');
            if (storedUserJSON) {
                storedUser = JSON.parse(storedUserJSON);
            }
        } catch (error) {
            console.error("Failed to parse user from localStorage", error);
            localStorage.removeItem('user');
        }

        if (storedUser?.id) {
            try {
                const response = await fetch(`/api/users`);
                 if (!response.ok) {
                    throw new Error("Failed to re-validate session.");
                }
                const allUsers: User[] = await response.json();
                const validUser = allUsers.find(u => u.id === storedUser!.id);

                if (validUser) {
                    setUser(validUser);
                    const userPermissions = await fetchPermissions(validUser.id);
                    setPermissions(userPermissions);
                } else {
                    setUser(null);
                    setPermissions(null);
                    localStorage.removeItem('user');
                }
            } catch(e) {
                 console.error("Session re-validation failed:", e);
                 setUser(null);
                 setPermissions(null);
                 localStorage.removeItem('user');
            }
        }
        
        setLoading(false);
    };
    initializeAuth();
  }, [fetchPermissions]);

  const login = async (credentials: { email: string; name: string, password?: string }): Promise<boolean> => {
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
