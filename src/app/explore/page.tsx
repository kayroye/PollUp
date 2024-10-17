'use client'
import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import LoadingAnimation from '../../components/LoadingAnimation';
import { Navbar } from '../../components/Navbar';
import { ApolloProvider } from '@apollo/client';
import client from '../../lib/apolloClient';
import '../../app/globals.css';
import { FaHome, FaCompass, FaSearch, FaBell, FaUser, FaPoll, FaSignOutAlt, FaPlus } from 'react-icons/fa';
import Link from 'next/link';
import Image from 'next/image';
import { useSidebar } from '@/hooks/useSidebar';
import SuggestionPane from '../../components/SuggestionPane';
import { useModal } from '../../contexts/ModalContext';

export default function Explore() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [showSidebarText, setShowSidebarText] = useState(false);
  const { isMobile, setIsMobile } = useSidebar();
  const [genres] = useState(['Trending', 'Politics', 'Sports', 'Entertainment', 'Technology', 'Science', 'Food', 'Travel']);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const currentPath = usePathname();
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
      setShowSidebarText(width >= 1440);
    };

    handleResize(); // Set initial state
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsMobile]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        scrollContainer.scrollLeft += e.deltaY;
      };
      scrollContainer.addEventListener('wheel', handleWheel);
      return () => scrollContainer.removeEventListener('wheel', handleWheel);
    }
  }, []);

  const isLoading = loading || !user;

  // Update mainContentStyle to be more responsive
  const mainContentStyle: React.CSSProperties = {
    marginLeft: isSidebarVisible ? (showSidebarText ? '16rem' : '5rem') : '0',
    width: isSidebarVisible ? (showSidebarText ? 'calc(100% - 16rem)' : 'calc(100% - 5rem)') : '100%',
    maxWidth: '100%',
    overflowX: 'hidden',
  };

  return (
    <ApolloProvider client={client}>
      <LoadingAnimation isLoading={isLoading} />
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
              {user && (
                <div className="p-4">
                  <button onClick={() => signOut()} className={`flex items-center text-sm text-red-500 hover:text-red-600 ${showSidebarText ? 'justify-start' : 'justify-center w-full h-20'}`}>
                    <FaSignOutAlt size={24} />
                    {showSidebarText && <span className="ml-2">Logout</span>}
                  </button>
                </div>
              )}
            </div>
          </nav>
        )}

        {/* Navbar */}
        <Navbar currentPath={currentPath ?? '/'} />

        <main className="flex-grow w-full px-4 sm:px-6 lg:px-8 py-8" style={mainContentStyle}>
          <div className="flex flex-col lg:flex-row justify-center lg:space-x-8 max-w-7xl mx-auto">
            <div className="flex-grow max-w-full lg:max-w-2xl">
              <h1 className="text-3xl font-bold mb-4 sm:mb-6 text-black">Explore Polls</h1>

              {/* Genre Navigation Bar */}
              <div 
                ref={scrollContainerRef}
                className="flex overflow-x-auto pb-2 mb-4 sm:mb-6 scrollbar-hide"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {genres.map((genre, index) => (
                  <button
                    key={index}
                    className="flex-shrink-0 px-3 py-1 sm:px-4 sm:py-2 mr-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-full hover:bg-blue-500 hover:text-white transition-colors duration-200"
                  >
                    {genre}
                  </button>
                ))}
              </div>

              {/* Add polls here */}
              <div className="space-y-6">

              </div>
            </div>
            
            {/* Add the SuggestionPane */}
            {!isMobile && (
              <div className="hidden lg:block w-full lg:w-80 mt-6 lg:mt-0">
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
    </ApolloProvider>
  );
}
