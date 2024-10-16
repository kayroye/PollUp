'use client'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import LoadingAnimation from '../components/LoadingAnimation';
import { Navbar } from '../components/Navbar';
import { ApolloProvider } from '@apollo/client';
import client from '../lib/apolloClient';
import Post from '../components/ui/post';
import '../app/globals.css';
import { FaHome, FaCompass, FaSearch, FaBell, FaUser, FaPoll, FaSignOutAlt, FaPlus } from 'react-icons/fa';
import Link from 'next/link';
import Image from 'next/image';
import { useSidebar } from '@/hooks/useSidebar';

// Creating sample posts for testing every case within the post component and interface
const samplePost = {
  _id: "123456789",
  content: "Check out this poll!",
  author: {
    _id: "987654321",
    preferred_username: "johndoe",
    profilePicture: "/logo.png",
    name: "John Doe",
  },
  createdAt: new Date("2024-04-15T12:00:00Z").toISOString(),
  type: "poll",
  pollContent: {
    _id: "poll123",
    question: "What's your favorite programming language?",
    type: "multiple" as const,
    options: ["JavaScript", "Python", "TypeScript", "Java", "C++"],
    votes: {
      "JavaScript": 15,
      "Python": 10,
      "TypeScript": 8,
      "Java": 5,
      "C++": 4,
    },
    createdAt: new Date("2024-04-15T12:00:00Z").toISOString(),
  },
  likes: ['user123', 'user456'],
  comments: ['user123', 'user456'],
  tags: ["programming", "poll"],
  visibility: "public",
};

const samplePost2 = {
  _id: "123456789",
  content: "This is a test post",
  author: {
    _id: "987654321",
    preferred_username: "testuser",
    profilePicture: "/logo.png",
    name: "Test User",
  },
  createdAt: new Date("2024-06-15T12:00:00Z").toISOString(),
  type: "text",
  likes: ['user123', 'user456'],
  comments: ['user123', 'user456'],
  tags: ["programming", "poll"],
  visibility: "public",
};

const samplePost3 = {
  _id: "123456789",
  content: "Pick a fav food lol",
  author: {
    _id: "987654321",
    preferred_username: "20yrsoldbtw",
    profilePicture: "/logo.png",
    name: "Unc",
  },
  createdAt: new Date("2024-10-15T12:00:00Z").toISOString(),
  type: "poll",
  pollContent: {
    _id: "poll123",
    question: "What's your favorite food?",
    type: "single" as const,
    options: ["Pizza", "Burger", "Pasta", "Sushi", "Tacos"],
    votes: {
      "Pizza": 0,
      "Burger": 0,
      "Pasta": 0,
      "Sushi": 0,
      "Tacos": 0,
    },
    createdAt: new Date("2024-10-15T12:00:00Z").toISOString(),
  },
  likes: [],
  comments: [],
  tags: ["food", "poll"],
  visibility: "public",
};

export default function Home() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  // Add state variables for sidebar
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [showSidebarText] = useState(true);
  const { isMobile, setIsMobile } = useSidebar();

  // Add effect to handle responsiveness
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsMobile(true);
        setIsSidebarVisible(false);
      } else {
        setIsMobile(false);
        setIsSidebarVisible(true);
      }
    };

    handleResize(); // Set initial state
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <LoadingAnimation />;
  }

  // Update mainContentStyle to be more responsive
  const mainContentStyle: React.CSSProperties = {
    marginLeft: isSidebarVisible ? (showSidebarText ? '16rem' : '5rem') : '0',
    transition: 'margin-left 0.3s ease-in-out',
    width: isSidebarVisible ? 'calc(100% - 16rem)' : '100%', // Adjust width based on sidebar visibility
    maxWidth: '100%',
    overflowX: 'hidden',
  };

  return (
    <ApolloProvider client={client}>
      <div className="flex flex-col min-h-screen bg-white">
        {/* Render Sidebar */}
        {isSidebarVisible && (
          <nav className={`fixed left-0 top-0 h-full bg-white shadow-md transition-all duration-300 ease-in-out ${showSidebarText ? 'w-64' : 'w-20'}`}>
            <div className="flex flex-col h-full">
              <Link href="/" className="flex items-center justify-center p-4">
                <Image
                  className="h-12 w-auto"
                  src="/logo.png"
                  alt="PollUp Logo"
                  width={128}
                  height={128}
                />
              </Link>
              <div className="flex-grow">
                <Link href="/" className="flex items-center p-4 text-gray-600 hover:bg-gray-100 hover:text-blue-500">
                  <FaHome size={24} />
                  {showSidebarText && <span className="ml-4">Home</span>}
                </Link>
                <Link href="/explore" className="flex items-center p-4 text-gray-600 hover:bg-gray-100 hover:text-blue-500">
                  <FaCompass size={24} />
                  {showSidebarText && <span className="ml-4">Explore</span>}
                </Link>
                <Link href="/create" className="flex items-center p-4 text-gray-600 hover:bg-gray-100 hover:text-blue-500">
                  <FaPoll size={24} />
                  {showSidebarText && <span className="ml-4">Create Poll</span>}
                </Link>
                <Link href="/search" className="flex items-center p-4 text-gray-600 hover:bg-gray-100 hover:text-blue-500">
                  <FaSearch size={24} />
                  {showSidebarText && <span className="ml-4">Search</span>}
                </Link>
                <Link href="/notifications" className="flex items-center p-4 text-gray-600 hover:bg-gray-100 hover:text-blue-500">
                  <FaBell size={24} />
                  {showSidebarText && <span className="ml-4">Notifications</span>}
                </Link>
                <Link href="/profile" className="flex items-center p-4 text-gray-600 hover:bg-gray-100 hover:text-blue-500">
                  <FaUser size={24} />
                  {showSidebarText && <span className="ml-4">Profile</span>}
                </Link>
              </div>
              {user && (
                <div className="p-4">
                  <button onClick={() => signOut()} className="flex items-center text-red-500 hover:text-red-600">
                    <FaSignOutAlt size={24} />
                    {showSidebarText && <span className="ml-2">Logout</span>}
                  </button>
                </div>
              )}
            </div>
          </nav>
        )}

        {/* Navbar */}
        <Navbar />

        <main className="flex-grow w-full px-4 sm:px-6 lg:px-8 py-8" style={mainContentStyle}>
          <h1 className="text-3xl font-bold mb-6 text-black">Welcome to PollUp, {user?.preferred_username || user?.email}!</h1>
          <div className="space-y-6 max-w-xl mx-auto">
            <Post post={samplePost} />
            <Post post={samplePost2} />
            <Post post={samplePost3} />
          </div>
        </main>

        {/* Mobile Create Button */}
        {isMobile && (
          <Link href="/create" className="fixed bottom-20 right-4 z-50">
            <button className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 shadow-lg transition-colors duration-200">
              <FaPlus size={24} />
            </button>
          </Link>
        )}
      </div>
    </ApolloProvider>
  );
}
