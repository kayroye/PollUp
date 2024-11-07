'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/ClerkAuthContext';
import LoadingAnimation from '../../components/LoadingAnimation';
import { Navbar } from '../../components/Navbar';
import Link from 'next/link';
import Image from 'next/image';
import { useSidebar } from '@/hooks/useSidebar';
import { usePathname } from 'next/navigation';
import { FaHome, FaCompass, FaSearch, FaBell, FaUser, FaPoll, FaSignOutAlt, FaPlus } from 'react-icons/fa';
import { useModal } from '../../contexts/ModalContext';
import { useQuery, gql } from '@apollo/client';
import SuggestionPane from '../../components/SuggestionPane';
import { SignOutButton, useUser } from '@clerk/nextjs';

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
  const { userId, isLoading } = useAuth();
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const currentPath = usePathname();

  // Sidebar state
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [showSidebarText, setShowSidebarText] = useState(false);
  const { isMobile, setIsMobile } = useSidebar();

  // Modal
  const { openModal } = useModal();
  const handleOpenCreatePollModal = () => {
    openModal('createPoll');
  };

  const getInitialSidebarState = () => {
    if (typeof window !== 'undefined') {
      return window.innerWidth > 768;
    }
    return false;
  };

  useEffect(() => {
    setIsSidebarVisible(getInitialSidebarState());
    setShowSidebarText(window.innerWidth >= 1440);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 768);
      setIsSidebarVisible(width > 768);
      setShowSidebarText(width >= 1200);
    };

    handleResize(); // Set initial state
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsMobile]);

  // Redirect if not authenticated
  useEffect(() => {
    if (isLoaded && !isSignedIn && !isLoading) {
      router.replace("/sign-in");
    }
  }, [isLoaded, isSignedIn, isLoading, router]);

  

  // Fetch user data
  const { data, error } = useQuery(GET_USER_BY_USERNAME, {
    variables: { username },
  });

  if (error) {
    return <p className="text-center text-red-500">Error: {error.message}</p>;
  }

  if (!isLoaded || isLoading || !userId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingAnimation isLoading={true} />
      </div>
    );
  }

  const profileUser = data?.getUserByUsername;

  if (!profileUser) {
    return <p className="text-center">User not found</p>;
  }

  


  // Main content style
  const mainContentStyle: React.CSSProperties = {
    marginLeft: isSidebarVisible ? (showSidebarText ? '16rem' : '5rem') : '0',
    width: isSidebarVisible ? (showSidebarText ? 'calc(100% - 16rem)' : 'calc(100% - 5rem)') : '100%',
    maxWidth: '100%',
    overflowX: 'hidden',
    paddingRight: '15px', // Add padding to ensure margin between content and suggestions
  };


  return (
    <div className="flex flex-col min-h-screen bg-white">
      <LoadingAnimation isLoading={isLoading} />
      {/* Sidebar */}
      {isSidebarVisible && (
        <nav className={`fixed left-0 top-0 h-full bg-white shadow-md transition-all duration-300 ease-in-out ${showSidebarText ? 'w-64' : 'w-20'}`}>
          <div className="flex flex-col h-full">
            <Link href="/" className={`flex items-center p-4 ${showSidebarText ? 'justify-start h-16' : 'justify-center h-20'}`}>
              <Image
                className={`w-auto ${showSidebarText ? 'h-12' : 'h-8'}`}
                src="/logo.png"
                alt="PollUp Logo"
                width={128}
                height={128}
              />
            </Link>
            <div className="flex-grow">
              {[
                { href: "/", icon: FaHome, text: "Home" },
                { href: "/explore", icon: FaCompass, text: "Explore" },
                { onClick: handleOpenCreatePollModal, icon: FaPoll, text: "Create Poll" },
                { href: "/search", icon: FaSearch, text: "Search" },
                { href: "/notifications", icon: FaBell, text: "Notifications" },
                { href: "/profile", icon: FaUser, text: "Profile" },
              ].map((item, index) => (
                item.onClick ? (
                  <button 
                    key={index}
                    onClick={item.onClick}
                    className={`flex items-center p-4 text-sm text-gray-600 hover:bg-gray-100 hover:text-blue-500 ${
                      showSidebarText ? 'justify-start w-full' : 'justify-center h-20 w-full'
                    }`}
                  >
                    <item.icon size={24} />
                    {showSidebarText && <span className="ml-4">{item.text}</span>}
                  </button>
                ) : (
                  <Link 
                    key={index} 
                    href={item.href} 
                    className={`flex items-center p-4 text-sm text-gray-600 hover:bg-gray-100 hover:text-blue-500 ${
                      showSidebarText ? 'justify-start' : 'justify-center h-20'
                    } ${
                      currentPath === item.href ? 'bg-gray-100 text-blue-500' : ''
                    }`}
                  >
                    <item.icon size={24} />
                    {showSidebarText && <span className="ml-4">{item.text}</span>}
                  </Link>
                )
              ))}
            </div>
            {userId && (
              <div className="p-4">
                <SignOutButton>
                  <button className={`flex items-center text-sm text-red-500 hover:text-red-600 ${showSidebarText ? 'justify-start' : 'justify-center w-full h-20'}`}>
                    <FaSignOutAlt size={24} />
                    {showSidebarText && <span className="ml-2">Logout</span>}
                  </button>
                </SignOutButton>
              </div>
            )}
          </div>
        </nav>
      )}

      {/* Navbar */}
      <Navbar currentPath={currentPath ?? '/'} />

      {/* Main Content */}
      <main className="flex-grow w-full px-4 sm:px-6 lg:px-8 py-8" style={mainContentStyle}>
        <div className="flex flex-col lg:flex-row justify-between max-w-7xl mx-auto">
          {/* Profile Content */}
          <div className="flex-grow lg:mr-4 xl:mr-8">
            <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 mb-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                <Image
                  src={profileUser.profilePicture || "/default_avatar.png"}
                  alt="Profile Picture"
                  width={100}
                  height={100}
                  className="rounded-full w-24 h-24 sm:w-32 sm:h-32"
                />
                <div className="flex flex-col items-center sm:items-start flex-grow">
                  <h2 className="text-xl sm:text-2xl font-bold text-black">{profileUser.name}</h2>
                  <p className="text-gray-600">@{profileUser.preferred_username}</p>
                  <p className="text-gray-700 mt-2 text-center sm:text-left">{profileUser.bio}</p>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-2">
                    <span className="text-gray-600">Posts: {profileUser.posts?.length || 0}</span>
                    <span className="text-gray-600">Followers: {profileUser.followers?.length || 0}</span>
                    <span className="text-gray-600">Following: {profileUser.following?.length || 0}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Recent Posts */}
            <div className="bg-white shadow-md rounded-lg p-4 sm:p-6">
              <h3 className="text-xl font-semibold mb-4">Recent Posts</h3>
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
      </main>

      {/* Mobile Create Button */}
      {isMobile && (
        <button onClick={handleOpenCreatePollModal} className="fixed bottom-20 right-4 z-50 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 shadow-lg transition-colors duration-200">
          <FaPlus size={24} />
        </button>
      )}
    </div>
  );
}
