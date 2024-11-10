'use client'

import { useQuery, gql } from '@apollo/client';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ProtectedLayout } from '@/components/ProtectedLayout';
import SuggestionPane from '../../components/SuggestionPane';
import { useSidebar } from '@/hooks/useSidebar';
import LoadingAnimation from '@/components/LoadingAnimation';
import { FaCog } from 'react-icons/fa';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';

const GET_USER_BY_USERNAME = gql`
  query GetUserByUsername($username: String!) {
    getUserByUsername(username: $username) {
      _id
      preferred_username
      profilePicture
      name
      bio
      followers
      following
      posts
    }
  }
`;

export default function UserProfileContent({ username }: { username: string }) {
  const currentPath = usePathname();
  const { isMobile } = useSidebar();
  const { user } = useUser()
  // Fetch user data
  const { data, error, loading: userLoading } = useQuery(GET_USER_BY_USERNAME, {
    variables: { username },
  });

  const profileUser = data?.getUserByUsername;

  if (error) {
    return (
      <ProtectedLayout currentPath={currentPath ?? "/"}>
        <p className="text-center text-red-500">Error: {error.message}</p>
      </ProtectedLayout>
    );
  }

  if (!profileUser) {
    return (
      <ProtectedLayout currentPath={currentPath ?? "/"}>
        <p className="text-center">User not found</p>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout currentPath={currentPath ?? `/`}>
      <LoadingAnimation isLoading={userLoading} />
      <div className="flex justify-between max-w-7xl mx-auto">
        {/* Profile Content */}
        <div className="flex-grow lg:mr-4 xl:mr-8">
          <div className="bg-white dark:bg-black shadow-md dark:shadow-none rounded-lg p-4 sm:p-6 mb-6 border border-gray-200 dark:border-gray-800">
            <div className="relative">
              {profileUser?.preferred_username === user?.username && (
                <div className="absolute top-0 right-0">
                  <Link
                    href="/settings"
                    className="flex items-center p-4 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-blue-500 dark:hover:text-blue-400 rounded-lg transition-colors duration-200"
                  >
                    <FaCog size={24} />
                  </Link>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                <Image
                  src={profileUser.profilePicture || "/default_avatar.png"}
                  alt="Profile Picture"
                  width={100}
                  height={100}
                  className="rounded-full w-24 h-24 sm:w-32 sm:h-32"
                />
                <div className="flex flex-col items-center sm:items-start flex-grow">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {profileUser.name}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    @{profileUser.preferred_username}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 mt-2 text-center sm:text-left">
                    {profileUser.bio}
                  </p>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-2">
                    <span className="text-gray-600 dark:text-gray-400">
                      Times Posted: {profileUser.posts?.length || 0}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      Followers: {profileUser.followers?.length || 0}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      Following: {profileUser.following?.length || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Recent Posts */}
          <div className="bg-white dark:bg-black shadow-md dark:shadow-none rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-800">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Recent Posts
            </h3>
            {/* Add logic to display recent posts */}
          </div>
        </div>

        {/* Suggestion Pane */}
        {!isMobile && (
          <div className="hidden lg:block lg:w-80 mt-6 lg:mt-0">
            <SuggestionPane />
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
