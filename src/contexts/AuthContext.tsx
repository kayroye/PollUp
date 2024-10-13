'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';
import { createUser, getUserByEmail } from '../lib/mongodb';
import jwt from 'jsonwebtoken';

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

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const decodedToken = jwt.verify(token, JWT_SECRET) as { userId: string };
          const userData = await getUserByEmail(decodedToken.userId);
          console.log(userData);
          setUser(userData as User);
        } catch (error) {
          console.error('Error verifying token:', error);
          localStorage.removeItem('authToken');
        }
      }
      setLoading(false);
    };

    initializeAuth();
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
      const token = jwt.sign({ userId: newUser.email }, JWT_SECRET, { expiresIn: '7d' });
      localStorage.setItem('authToken', token);
      setUser(newUser);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    // Simulate sign in
    try {
      const dbUser = await getUserByEmail(email);
      if (dbUser && dbUser.password === password) {
        const token = jwt.sign({ userId: dbUser.email }, JWT_SECRET, { expiresIn: '7d' });
        localStorage.setItem('authToken', token);
        setUser(dbUser as User);
      } else if (dbUser && dbUser.password !== password) {
        throw new Error('Incorrect password');
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
    localStorage.removeItem('authToken');
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
