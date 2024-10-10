'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';
import { createUser, getUserByEmail } from '../lib/mongodb';

// Define User interface based on the schema
interface User {
    __id: string;
    preferred_username: string;
    email: string;
    name: string;
    password: string;
    profilePicture: string;
    oauthProviders: string[];
    bio: string;
    preferences: object;
}

interface AuthContextType {
  user: User | null;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate checking for a logged-in user
    const checkLoggedInUser = async () => {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        const dbUser = await getUserByEmail(parsedUser.email);
        if (dbUser) {
          setUser(dbUser as User);
        }
      }
      setLoading(false);
    };

    checkLoggedInUser();
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    // Simulate user creation
    const newUser: User = {
      __id: Math.random().toString(36).substr(2, 9),
      preferred_username: username,
      email,
      name: '',
      password: password,
      profilePicture: '',
      oauthProviders: [],
      bio: '',
      preferences: {}
    };

    try {
      await createUser(newUser);
      setUser(newUser);
      localStorage.setItem('currentUser', JSON.stringify(newUser));
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    // Simulate sign in
    try {
      const dbUser = await getUserByEmail(email);
      console.log(dbUser);
      // Check the password
      if (dbUser && dbUser.password === password) {
        setUser(dbUser as User);
        localStorage.setItem('currentUser', JSON.stringify(dbUser));
      } else {
        throw new Error('User not found');
      }
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signOut = () => {
    // Simulate sign out
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  return (
    <AuthContext.Provider value={{ user, signUp, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};