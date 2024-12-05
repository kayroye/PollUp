'use client'

import { SignUp, useSignUp, useAuth } from '@clerk/nextjs'
import { useEffect } from 'react'
import { useMutation, gql } from '@apollo/client'

const CREATE_USER_MUTATION = `#graphql
  mutation CreateUser($preferred_username: String!, $password: String!, $email: String!, $name: String!, $clerkUserId: String!) {
    createUser(
      preferred_username: $preferred_username
      password: $password
      email: $email
      name: $name
      clerkUserId: $clerkUserId
    ) {
      _id
      preferred_username
      email
    }
  }
`

export default function SignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const { userId } = useAuth()
  const [createUser] = useMutation(gql`${CREATE_USER_MUTATION}`)

  useEffect(() => {
    if (!userId) return

    const createMongoUser = async () => {
      const userData = signUp?.createdSessionId && signUp?.createdUserId
      if (userData) {
        try {
          const { username, emailAddress, firstName, lastName } = signUp?.unsafeMetadata
          console.log(username, emailAddress, firstName, lastName)
          await createUser({
            variables: {
              preferred_username: username,
              password: 'clerk-managed', // You might want to generate a random password here
              email: emailAddress,
              name: `${firstName} ${lastName}`,
              clerkUserId: userData
            }
          })
          console.log('User created in MongoDB')
        } catch (error) {
          console.error('Error creating user in MongoDB:', error)
        }
      }
    }

    createMongoUser()
  }, [isLoaded, signUp, createUser, setActive, userId])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md p-6">
        <SignUp path="/sign-up"/>
      </div>
    </div>
  )
}
