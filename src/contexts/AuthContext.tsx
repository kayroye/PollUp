'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';
import { getUserByEmail } from '../lib/mongodb';
import jwt from 'jsonwebtoken';
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

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

// Initialize Apollo Client
const client = new ApolloClient({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || '/api/graphql',
  cache: new InMemoryCache(),
  headers: {
    Authorization: `Bearer ${localStorage.getItem('authToken')}`,
  },
});

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
    try {
      await client.mutate({
        mutation: gql`
          mutation SignUp($email: String!, $password: String!, $username: String!) {
            signUp(email: $email, password: $password, username: $username) {
              token
              user {
                __id
                preferred_username
                email
              }
            }
          }
        `,
        variables: { email, password, username },
      }).then(response => {
        const { token, user } = response.data.signUp;
        localStorage.setItem('authToken', token);
        setUser(user);
      });
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await client.mutate({
        mutation: gql`
          mutation SignIn($email: String!, $password: String!) {
            signIn(email: $email, password: $password) {
              token
              user {
                __id
                preferred_username
                email
              }
            }
          }
        `,
        variables: { email, password },
      });

      const { token, user } = response.data.signIn;
      localStorage.setItem('authToken', token);
      setUser(user);
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
