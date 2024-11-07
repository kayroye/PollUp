'use client'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/ClerkAuthContext';
import LoadingAnimation from '../../components/LoadingAnimation';
import { Navbar } from '../../components/Navbar';
import { ApolloProvider, useQuery, gql } from '@apollo/client';
import client from '@/lib/apolloClient';
import '@/app/globals.css';
import { FaHome, FaSearch, FaBell, FaUser, FaPoll, FaSignOutAlt, FaPlus, FaCog } from 'react-icons/fa';
import Link from 'next/link';
import Image from 'next/image';
import { useSidebar } from '@/hooks/useSidebar';
import SuggestionPane from '../../components/SuggestionPane';
import { usePathname } from 'next/navigation';
import { useModal } from '../../contexts/ModalContext';
import { SignOutButton, useUser } from '@clerk/nextjs'

// Define what data we want to fetch from the server
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

export default function Profile() {
  const router = useRouter();
  const currentPath = usePathname();
  const { openModal } = useModal();
  const { userId, isLoading } = useAuth();
  const { isLoaded, isSignedIn } = useUser();

  // Add state variables for sidebar
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [showSidebarText, setShowSidebarText] = useState(false);
  const { isMobile, setIsMobile } = useSidebar();
  

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

  // Add effect to handle responsiveness
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 768);
      setIsSidebarVisible(width > 768);
      setShowSidebarText(width >= 1440);
    };

    handleResize(); // Set initial state
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsMobile]);

  // Move the useQuery hook before any conditional returns
  const { data: profileData, error: profileError, loading: profileLoading } = useQuery(GET_USER_PROFILE, {
    variables: { userId: userId },
    skip: !userId, // Skip the query if user is not loaded yet
    fetchPolicy: 'cache-and-network',
  });

  if(profileError) {
    console.error('Error fetching user profile:', profileError);
  }


  useEffect(() => {
    if (isLoaded && !isSignedIn && !isLoading) {
      router.replace("/sign-in");
    }
  }, [isLoaded, isSignedIn, isLoading, router]);

  if (!isLoaded || isLoading || !userId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingAnimation isLoading={true} />
      </div>
    );
  }

  // Update mainContentStyle
  const mainContentStyle: React.CSSProperties = {
    marginLeft: isSidebarVisible ? (showSidebarText ? '16rem' : '5rem') : '0',
    width: isSidebarVisible ? (showSidebarText ? 'calc(100% - 16rem)' : 'calc(100% - 5rem)') : '100%',
    maxWidth: '100%',
    overflowX: 'hidden',
  };

  // Add this near the top of your component
  const handleOpenCreatePollModal = () => {
    openModal('createPoll');
  };

  return (
    <ApolloProvider client={client}>
      <LoadingAnimation isLoading={profileLoading} />
      <div className="flex flex-col min-h-screen bg-white">
        {/* Render Sidebar */}
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
                  { href: "/discover", icon: FaSearch, text: "Discover" },
                  { onClick: handleOpenCreatePollModal, icon: FaPoll, text: "Create Poll" },
                  { href: "/notifications", icon: FaBell, text: "Notifications" },
                  { href: "/profile", icon: FaUser, text: "Profile" },
                ].map((item, index) => (
                  item.onClick ? (
                    <button 
                      key={index}
                      onClick={item.onClick}
                      className={`flex items-center p-4 text-sm hover:bg-gray-100 ${
                        showSidebarText ? 'justify-start w-full' : 'justify-center h-20 w-full'
                      } ${
                        currentPath === item.href ? 'text-blue-500' : 'text-gray-600 hover:text-blue-500'
                      }`}
                    >
                      <item.icon size={24} />
                      {showSidebarText && <span className="ml-4">{item.text}</span>}
                    </button>
                  ) : (
                    <Link 
                      key={index} 
                      href={item.href} 
                      className={`flex items-center p-4 text-sm hover:bg-gray-100 ${
                        showSidebarText ? 'justify-start' : 'justify-center h-20'
                      } ${
                        currentPath === item.href ? 'bg-gray-100 text-blue-500' : 'text-gray-600 hover:text-blue-500'
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

        <main className="flex-grow w-full px-4 sm:px-6 lg:px-8 py-8" style={mainContentStyle}>
          <div className="flex flex-col items-left space-y-8 max-w-7xl mx-auto">
            {/* Profile Panel */}
            <div className="relative w-full max-w-2xl bg-white shadow-md rounded-lg p-6">
              <div className="absolute top-4 right-4">
                  <Link
                    href="/settings"
                    className={`flex items-center p-4 text-sm text-gray-600 hover:bg-gray-100 hover:text-blue-500 rounded-lg${currentPath === "/settings" ? 'bg-gray-100 text-blue-500' : ''
                      }`}
                  >
                    <FaCog size={24} />
                    {showSidebarText && <span className="ml-2">Settings</span>}
                  </Link>
                </div>
              <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                <Image
                  src={profileData?.getUserById?.profilePicture || "/default_avatar.png"}
                  alt="Profile Picture"
                  width={100}
                  height={100}
                  className="rounded-full"
                />
                <div className="flex flex-col items-center sm:items-start">
                  <h2 className="text-2xl font-bold text-black">{profileData?.getUserById?.name}</h2>
                  <p className="text-gray-600">@{profileData?.getUserById?.preferred_username}</p>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-2">
                    <span className="text-gray-600">Posts: {profileData?.getUserById?.posts?.length || 0}</span>
                    <span className="text-gray-600">Followers: {profileData?.getUserById?.followers?.length || 0}</span>
                    <span className="text-gray-600">Following: {profileData?.getUserById?.following?.length || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center space-x-4 lg:space-x-8 w-full">
              <div className="flex-grow max-w-2xl">
                <div className="space-y-6">
                  {/* You can add new content here if needed */}
                </div>
              </div>
              
              {/* Add the SuggestionPane */}
              {!isMobile && (
                <div className="hidden lg:block w-80">
                  <SuggestionPane />
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Mobile Create Button */}
        {isMobile && (
          <button onClick={handleOpenCreatePollModal} className="fixed bottom-20 right-4 z-50 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 shadow-lg transition-colors duration-200">
            <FaPlus size={24} />
          </button>
        )}
      </div>
    </ApolloProvider>
  );
}
