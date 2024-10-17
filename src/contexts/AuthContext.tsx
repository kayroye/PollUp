'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

// Define User interface based on the schema
interface User {
    _id: string;
    preferred_username: string;
    email: string;
    name: string;
    password: string;
    profilePicture: string;
    oauthProviders: string[];
    bio: string;
    preferences: object;
    followers: string[];
    following: string[];
    createdAt: string;
    posts: string[];
}

interface AuthContextType {
  user: User | null;
  signUp: (email: string, password: string, username: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Initialize Apollo Client with credentials
const client = new ApolloClient({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || '/api/graphql',
  cache: new InMemoryCache(),
  credentials: 'include', // Include cookies in requests
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      
        try {
          const response = await fetch('/api/authenticate', {
            method: 'GET',
            credentials: 'include',
          });

          if (response.ok) {
            const data = await response.json();
            const userId = data.userId;

            // Fetch user data from the server
            const { data: userData } = await client.query({
              query: gql`
                query GetUserById($userId: String!) {
                  getUserById(_id: $userId) {
                    _id
                    preferred_username
                    email
                    name
                    profilePicture
                    oauthProviders
                    bio
                    preferences
                    followers
                    following
                    createdAt
                    posts
                  }
                }
              `,
              variables: { userId },
            });

            setUser(userData.getUserById as User);
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error('Error during authentication:', error);
          setUser(null);
        }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const signUp = async (email: string, password: string, username: string, name: string) => {
    try {
      const { data } = await client.mutate({
        mutation: gql`
          mutation SignUp($email: String!, $password: String!, $username: String!, $name: String!) {
            signUp(email: $email, password: $password, username: $username, name: $name) {
              user {
                _id
                preferred_username
                email
              }
            }
          }
        `,
        variables: { email, password, username, name },
      });

      const userData = data.signUp.user;
      setUser(userData as User);
      // Server should set HttpOnly cookie upon successful sign-up
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

      const userData = data.signIn.user;
      setUser(userData as User);
      // Server should set HttpOnly cookie upon successful sign-in
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await fetch('/api/signout', {
        method: 'POST',
        credentials: 'include', // Ensure cookies are included
      });
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
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
