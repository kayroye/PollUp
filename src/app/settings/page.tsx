"use client";
import { usePathname } from "next/navigation";
import { useQuery, gql } from "@apollo/client";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { useAuth } from "@/contexts/ClerkAuthContext";
import { SignOutButton, useUser } from "@clerk/nextjs";
import LoadingAnimation from "@/components/LoadingAnimation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";

// Keep the existing query
const GET_USER_PROFILE = gql`
  query getUserById($userId: String!) {
    getUserById(_id: $userId) {
      _id
      preferred_username
      profilePicture
      name
      bio
      preferences
      followers
      following
      createdAt
      posts
    }
  }
`;

export default function Settings() {
  const currentPath = usePathname();
  const { userId } = useAuth();
  const { user } = useUser();
  const { theme, setTheme } = useTheme();
  const {
    error: profileError,
    loading: profileLoading,
  } = useQuery(GET_USER_PROFILE, {
    variables: { userId: userId },
    skip: !userId,
  });

  if (profileError) {
    console.error("Error fetching user profile:", profileError);
  }

  return (
    <ProtectedLayout currentPath={currentPath ?? "/"}>
      <LoadingAnimation isLoading={profileLoading} />
      <div className="relative max-w-2xl mx-auto bg-white dark:bg-black shadow-md dark:shadow-none border border-transparent dark:border-gray-800 rounded-lg p-6">
        <div className="flex items-center mb-6">
          <Link 
            href={`/${user?.username}`}
            className="md:hidden mr-2 text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300"
          >
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        </div>
        {/* Profile settings */}
        <h2 className="text-xl font-bold mt-6 mb-4 text-gray-900 dark:text-white">Profile</h2>
        <div className="flex items-center justify-between">
          <p className="mr-4 text-gray-700 dark:text-gray-300">Placeholder</p>
          <label className="inline-flex items-center cursor-pointer">
            <input type="checkbox" value="" className="sr-only peer" />
            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
        {/* Privacy settings */}
        <h2 className="text-xl font-bold mt-6 mb-4 text-gray-900 dark:text-white">Privacy</h2>
        <div className="flex items-center justify-between">
          <p className="mr-4 text-gray-700 dark:text-gray-300">Placeholder</p>
          <label className="inline-flex items-center cursor-pointer">
            <input type="checkbox" value="" className="sr-only peer" />
            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
        {/* Appearance settings*/}
        <h2 className="text-xl font-bold mt-6 mb-4 text-gray-900 dark:text-white">Appearance</h2>
        <div className="flex items-center justify-between">
          <p className="mr-4 text-gray-700 dark:text-gray-300">Dark Mode</p>
          <label className="inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={theme === 'dark'}
              onChange={(e) => setTheme(e.target.checked ? 'dark' : 'light')}
              className="sr-only peer" 
            />
            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
        {/* Logout button */}
        <div className="flex items-center justify-center mt-6">
          <SignOutButton>
            <button className="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors duration-200">
              Logout
            </button>
          </SignOutButton>
        </div>
      </div>
    </ProtectedLayout>
  );
}
