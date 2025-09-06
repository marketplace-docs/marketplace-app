
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

const allowedEmails = [
    'arlan.saputra@marketplace.com',
    'rudi.setiawan@marketplace.com',
    'nova.aurelia@marketplace.com',
    'nurul.tanzilla@marketplace.com',
    'regina.rifana@marketplace.com'
];

const validPassword = 'Marketplace@123!!!';

const formatUserName = (email: string) => {
    const namePart = email.split('@')[0];
    return namePart
        .split('.')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

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
    if (allowedEmails.includes(lowercasedEmail) && credentials.password === validPassword) {
        try {
            // Fetch user role from the database
            const response = await fetch(`/api/users?email=${encodeURIComponent(lowercasedEmail)}`);
            if (!response.ok) {
                console.error("Failed to fetch user role, proceeding without it.");
                 const loggedInUser: User = { 
                    email: lowercasedEmail,
                    name: formatUserName(lowercasedEmail),
                    role: 'Reguler' // Default role on failure
                };
                setUser(loggedInUser);
                localStorage.setItem('user', JSON.stringify(loggedInUser));
                return true;
            }
            const userData = await response.json();
            
            const loggedInUser: User = { 
                email: lowercasedEmail,
                name: userData.name || formatUserName(lowercasedEmail),
                role: userData.role || 'Reguler' // Default role if not found
            };
            setUser(loggedInUser);
            localStorage.setItem('user', JSON.stringify(loggedInUser));
            return true;

        } catch (error) {
            console.error("Error fetching user role:", error);
             const loggedInUser: User = { 
                email: lowercasedEmail,
                name: formatUserName(lowercasedEmail),
                role: 'Reguler' // Default role on fetch error
            };
            setUser(loggedInUser);
            localStorage.setItem('user', JSON.stringify(loggedInUser));
            return true;
        }
    }
    return false;
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
