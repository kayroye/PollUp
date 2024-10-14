'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';
import jwt from 'jsonwebtoken';
import { ApolloClient, InMemoryCache, gql, createHttpLink } from '@apollo/client';

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
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Update Apollo Client headers with the auth token
    client.setLink(
      createHttpLink({
        uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || '/api/graphql',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      })
    );

    const initializeAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          // Add a type check for JWT_SECRET
          if (typeof JWT_SECRET !== 'string') {
            throw new Error('JWT_SECRET is not properly configured');
          }

          const decodedToken = jwt.verify(token, JWT_SECRET) as { userId: string };
          const { data } = await client.query({
            query: gql`
              query GetUserByEmail($email: String!) {
                getUserByEmail(email: $email) {
                  __id
                  preferred_username
                  email
                  name
                  profilePicture
                  oauthProviders
                  bio
                  preferences
                }
              }
            `,
            variables: { email: decodedToken.userId },
          });
          const userData = data.getUserByEmail;
          console.log(userData);
          setUser(userData as User);
        } catch (error) {
          console.error('Error verifying token:', error);
          if (error instanceof jwt.JsonWebTokenError) {
            console.error('JWT Error:', error.message);
          } else if (error instanceof TypeError) {
            console.error('Type Error:', error.message);
          } else {
            console.error('Unknown error type:', error);
          }
          localStorage.removeItem('authToken');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    try {
      const { data } = await client.mutate({
        mutation: gql`
          mutation SignUp($email: String!, $password: String!, $username: String!) {
            signUp(email: $email, password: $password, username: $username) {
              token
              user {
                _id
                preferred_username
                email
              }
            }
          }
        `,
        variables: { email, password, username },
      });

      const { token, user } = data.signUp;
      console.log(token, user);
      localStorage.setItem('authToken', token);
      setUser(user);
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data } = await client.mutate({
        mutation: gql`
          mutation SignIn($email: String!, $password: String!) {
            signIn(email: $email, password: $password) {
              token
              user {
                _id
                preferred_username
                email
              }
            }
          }
        `,
        variables: { email, password },
      });

      const { token, user } = data.signIn;
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
