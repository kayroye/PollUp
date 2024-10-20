'use client'
import { SignIn } from '@clerk/nextjs'

const LoginPage = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-6">
        <SignIn path="/sign-in" />
      </div>
    </div>
  )
}

export default LoginPage
