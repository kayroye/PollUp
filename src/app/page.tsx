"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingAnimation from "../components/LoadingAnimation";
import { Navbar } from "../components/Navbar";
import Post from "../components/ui/post";
import "../app/globals.css";
import {
  FaHome,
  FaCompass,
  FaSearch,
  FaBell,
  FaUser,
  FaPoll,
  FaSignOutAlt,
  FaPlus,
} from "react-icons/fa";
import Link from "next/link";
import Image from "next/image";
import { useSidebar } from "@/hooks/useSidebar";
import SuggestionPane from "../components/SuggestionPane";
import { usePathname } from "next/navigation";
import { useQuery, gql } from "@apollo/client";
import { ObjectId } from "mongodb";
import { useModal } from "../contexts/ModalContext";
import { useUser, SignOutButton } from "@clerk/nextjs";
import { useAuth } from "@/contexts/ClerkAuthContext";

const LIST_POSTS = gql`
  query ListPosts {
    listPosts {
      _id
      content
      type
      likes
      comments
      parentPost
      createdAt
      author {
        preferred_username
        profilePicture
        name
      }
      pollContent {
        question
        type
        options
        min
        max
        votes
      }
    }
  }
`;

interface User {
  _id: ObjectId;
  preferred_username: string;
  password: string;
  email: string;
  name: string;
  profilePicture: string;
  oauthProviders: string[];
  bio: string;
  preferences: object;
  followers: ObjectId[];
  following: ObjectId[];
  createdAt: Date;
  posts: ObjectId[];
}

interface Post {
  _id: string;
  content: string;
  parentPost?: ObjectId | null;
  author: User;
  createdAt: string;
  type: "comment" | "poll";
  pollContent?: PollContentType;
  mediaUrls?: string[];
  likes: ObjectId[];
  comments: ObjectId[];
  tags: string[];
  visibility: "public" | "friends" | "private";
}

interface PollContentType {
  _id: string;
  question: string;
  type: "multiple" | "single" | "slider";
  options: string[];
  min?: number;
  max?: number;
  votes: Record<string, number>;
  createdAt: string;
}

export default function Home() {
  const router = useRouter();
  const currentPath = usePathname();
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [showSidebarText, setShowSidebarText] = useState(false);
  const { isMobile, setIsMobile } = useSidebar();
  const { openModal } = useModal();
  const { isLoaded, isSignedIn, user } = useUser();
  const { userId } = useAuth();
  const {
    data,
    loading: postsLoading,
    error: postsError,
  } = useQuery(LIST_POSTS, {
    fetchPolicy: "cache-and-network",
  });

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);
  
  const handleOpenCreatePollModal = () => {
    openModal("createPoll");
  };

  const getInitialSidebarState = () => {
    if (typeof window !== "undefined") {
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

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setIsMobile]);

  if (!isLoaded || !userId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingAnimation isLoading={true} />
      </div>
    );
  }

  if (postsError) {
    console.error("Error fetching posts:", postsError);
    return <p className="text-center text-red-500">Failed to load posts.</p>;
  }

  const posts: Post[] = data?.listPosts || [];

  // Filter out comments
  const filteredPosts = posts.filter(post => post.type !== 'comment');

  const mainContentStyle: React.CSSProperties = {
    marginLeft: isSidebarVisible ? (showSidebarText ? "16rem" : "5rem") : "0",
    width: isSidebarVisible
      ? showSidebarText
        ? "calc(100% - 16rem)"
        : "calc(100% - 5rem)"
      : "100%",
    maxWidth: "100%",
    height: "calc(100vh - 0px)",
    overflow: "hidden",
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <LoadingAnimation isLoading={postsLoading} />
      {isSidebarVisible && (
        <nav
          className={`fixed left-0 top-0 h-full bg-white shadow-md transition-all duration-300 ease-in-out ${
            showSidebarText ? "w-64" : "w-20"
          }`}
        >
          <div className="flex flex-col h-full">
            <Link
              href="/"
              className={`flex items-center p-4 ${
                showSidebarText ? "justify-start h-16" : "justify-center h-20"
              }`}
            >
              <Image
                className={`w-auto ${showSidebarText ? "h-12" : "h-8"}`}
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
                {
                  onClick: handleOpenCreatePollModal,
                  icon: FaPoll,
                  text: "Create Poll",
                },
                { href: "/search", icon: FaSearch, text: "Search" },
                { href: "/notifications", icon: FaBell, text: "Notifications" },
                { href: "/profile", icon: FaUser, text: "Profile" },
              ].map((item, index) =>
                item.onClick ? (
                  <button
                    key={index}
                    onClick={item.onClick}
                    className={`flex items-center p-4 text-sm hover:bg-gray-100 ${
                      showSidebarText
                        ? "justify-start w-full"
                        : "justify-center h-20 w-full"
                    } ${
                      currentPath === item.href
                        ? "text-blue-500"
                        : "text-gray-600 hover:text-blue-500"
                    }`}
                  >
                    <item.icon size={24} />
                    {showSidebarText && (
                      <span className="ml-4">{item.text}</span>
                    )}
                  </button>
                ) : (
                  <Link
                    key={index}
                    href={item.href}
                    className={`flex items-center p-4 text-sm hover:bg-gray-100 ${
                      showSidebarText ? "justify-start" : "justify-center h-20"
                    } ${
                      currentPath === item.href
                        ? "bg-gray-100 text-blue-500"
                        : "text-gray-600 hover:text-blue-500"
                    }`}
                  >
                    <item.icon size={24} />
                    {showSidebarText && (
                      <span className="ml-4">{item.text}</span>
                    )}
                  </Link>
                )
              )}
            </div>
            {user && (
              <div className="p-4">
                <SignOutButton>
                  <button
                    className={`flex items-center text-sm text-red-500 hover:text-red-600 ${
                      showSidebarText
                        ? "justify-start"
                        : "justify-center w-full h-20"
                    }`}
                  >
                    <FaSignOutAlt size={24} />
                    {showSidebarText && <span className="ml-2">Logout</span>}
                  </button>
                </SignOutButton>
              </div>
            )}
          </div>
        </nav>
      )}

      <Navbar currentPath={currentPath ?? "/"} />

      <main
        className="flex-grow w-full px-4 sm:px-6 lg:px-8 py-8 overflow-hidden"
        style={mainContentStyle}
      >
        <div className="flex justify-center space-x-4 lg:space-x-8 max-w-7xl mx-auto h-[calc(100vh-8rem)]">
          <div className="flex-grow max-w-2xl overflow-hidden">
            <div className="h-full overflow-y-auto space-y-6 pr-4 custom-scrollbar">
              {filteredPosts.length > 0 ? (
                filteredPosts.map((post: Post) => <Post key={post._id} post={post} />)
              ) : (
                <p className="text-center text-gray-500">
                  No posts to display at the moment.
                </p>
              )}
            </div>
          </div>

          {!isMobile && (
            <div className="hidden lg:block w-80">
              <SuggestionPane />
            </div>
          )}
        </div>
      </main>

      {isMobile && (
        <button
          onClick={handleOpenCreatePollModal}
          className="fixed bottom-20 right-4 z-50 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 shadow-lg transition-colors duration-200"
        >
          <FaPlus size={24} />
        </button>
      )}
    </div>
  );
}
