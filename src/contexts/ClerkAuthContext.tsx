'use client'
import React, { useContext, useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { gql, useMutation, useQuery } from '@apollo/client';
import { createContext } from 'react';
import LoadingAnimation from '../components/LoadingAnimation';

interface AuthContextType {
    userId: string | null;
    isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const GET_USER_BY_USERNAME = gql`
  query GetUserByUsername($username: String!) {
    getUserByUsername(username: $username) {
      _id
    }
  }
`;

const SIGN_UP_MUTATION = gql`
  mutation SignUp($email: String!, $username: String!, $name: String!, $clerkUserId: String!, $profilePicture: String) {
    signUp(email: $email, username: $username, name: $name, clerkUserId: $clerkUserId, profilePicture: $profilePicture) {
      user {
        _id
        preferred_username
        email
        profilePicture
      }
    }
  }
`;

export default function ClerkAuthContext({ children }: { children: React.ReactNode }) {
  const { isLoaded: isClerkLoaded, isSignedIn, user } = useUser()
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const { data: userData, loading: userLoading } = useQuery(GET_USER_BY_USERNAME, {
    variables: { username: user?.username },
    skip: !isClerkLoaded || !isSignedIn || !user?.username,
    fetchPolicy: 'network-only', // This ensures we always get the latest data from the server
  })

  const [signUp] = useMutation(SIGN_UP_MUTATION)

  useEffect(() => {
    const syncUser = async () => {
      if (isClerkLoaded && isSignedIn && user && !userLoading) {
        if (userData?.getUserByUsername?._id) {
          console.log('User exists in MongoDB:', userData.getUserByUsername._id)
          setUserId(userData.getUserByUsername._id)
          setIsLoading(false)
        } else {
          console.log('User does not exist in MongoDB, creating...')
          try {
            const { data } = await signUp({
              variables: {
                clerkUserId: user.id,
                username: user.username,
                email: user.primaryEmailAddress?.emailAddress,
                name: `${user.firstName} ${user.lastName}`,
                profilePicture: user.imageUrl,
              }
            })
            console.log('User created in MongoDB:', data.signUp.user._id)
            setUserId(data.signUp.user._id)
            setIsLoading(false)
          } catch (error) {
            console.error('Error creating user in MongoDB:', error)
            setIsLoading(false)
          }
        }
      } else if (!isClerkLoaded || !isSignedIn) {
        setIsLoading(false)
      }
    }

    syncUser()
  }, [isClerkLoaded, isSignedIn, user, userData, userLoading, signUp])

  // If Clerk is still loading, or if the user is signed in but we're still checking MongoDB, show loading state
  if (isLoading) {
    return <LoadingAnimation isLoading={true} />
  }

  return (
    <AuthContext.Provider value={{ userId, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}
