'use client'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import LoadingAnimation from '../components/LoadingAnimation';
import { Navbar } from '../components/Navbar';
import Post from '../components/ui/post';
import '../app/globals.css';
import { FaHome, FaCompass, FaSearch, FaBell, FaUser, FaPoll, FaSignOutAlt, FaPlus } from 'react-icons/fa';
import Link from 'next/link';
import Image from 'next/image';
import { useSidebar } from '@/hooks/useSidebar';
import SuggestionPane from '../components/SuggestionPane';
import { usePathname } from 'next/navigation';
import { useQuery, gql } from '@apollo/client';

// Define the GraphQL query outside the component
const LIST_POSTS = gql`
  query ListPosts {
    listPosts {
      _id
      content
    }
  }
`;

// Update the Post interface
interface Post {
  _id: string;
  content: string;
  author: {
    _id: string;
    preferred_username: string;
    profilePicture: string;
    name: string;
  };
  createdAt: string;
  type: string;
  pollContent?: {
    _id: string;
    question: string;
    type: "multiple" | "single" | "slider";
    options: string[];
    votes: Record<string, number>;
    createdAt: string;
  };
  likes: string[];  // Change this from number to string[]
  comments: string[];  // Change this from number to string[]
  tags: string[];
  visibility: string;
}

export default function Home() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const currentPath = usePathname();

  // Add state variables for sidebar
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [showSidebarText, setShowSidebarText] = useState(true);
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
      setShowSidebarText(window.innerWidth >= 1440);
    };

    handleResize(); // Set initial state
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsMobile]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);


  // Use Apollo's useQuery hook to fetch posts
  const { data, loading: postsLoading, error: postsError } = useQuery(LIST_POSTS, {
    fetchPolicy: 'cache-and-network',
  });

  if (authLoading || postsLoading) {
    return <LoadingAnimation />;
  }

  if (postsError) {
    console.error('Error fetching posts:', postsError);
    return <p className="text-center text-red-500">Failed to load posts.</p>;
  }

  const posts: Post[] = data?.listPosts || [];

  // Update mainContentStyle if necessary
  const mainContentStyle: React.CSSProperties = {
    marginLeft: isSidebarVisible ? (showSidebarText ? '16rem' : '5rem') : '0',
    transition: 'margin-left 0.3s ease-in-out',
    width: isSidebarVisible ? (showSidebarText ? 'calc(100% - 16rem)' : 'calc(100% - 5rem)') : '100%',
    maxWidth: '100%',
    overflowX: 'hidden',
  };

  return (
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
                { href: "/create", icon: FaPoll, text: "Create Poll" },
                { href: "/search", icon: FaSearch, text: "Search" },
                { href: "/notifications", icon: FaBell, text: "Notifications" },
                { href: "/profile", icon: FaUser, text: "Profile" },
              ].map((item, index) => (
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
        <div className="flex justify-center space-x-4 lg:space-x-8 max-w-7xl mx-auto">
          <div className="flex-grow max-w-2xl">
            <div className="space-y-6">
              {posts.length > 0 ? (
                posts.map((post: Post) => <Post key={post._id} post={post} />)
              ) : (
                <p className="text-center text-gray-500">Looks like we&apos;ve reached the end!</p>
              )}
            </div>
          </div>
          
          {/* Add the SuggestionPane */}
          {!isMobile && (
            <div className="hidden lg:block w-80">
              <SuggestionPane />
            </div>
          )}
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
  );
}
