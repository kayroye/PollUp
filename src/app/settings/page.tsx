"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/ClerkAuthContext";
import LoadingAnimation from "../../components/LoadingAnimation";
import { Navbar } from "../../components/Navbar";
import { ApolloProvider, useQuery, gql } from "@apollo/client";
import client from "@/lib/apolloClient";
import "../../app/globals.css";
import {
  FaHome,
  FaCompass,
  FaSearch,
  FaBell,
  FaUser,
  FaPoll,
  FaSignOutAlt,
} from "react-icons/fa";
import Link from "next/link";
import Image from "next/image";
import { useSidebar } from "@/hooks/useSidebar";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
import { useModal } from "@/contexts/ModalContext";

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

export default function Settings() {
  const router = useRouter();
  const currentPath = usePathname();
  const { userId } = useAuth();
  const { openModal } = useModal();
  // Update state variables for sidebar
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [showSidebarText, setShowSidebarText] = useState(false);
  const { setIsMobile } = useSidebar();

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

  // Update effect to handle responsiveness
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 768);
      setIsSidebarVisible(width > 768);
      setShowSidebarText(width >= 1440);
    };

    handleResize(); // Set initial state
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setIsMobile]);

  // Move the useQuery hook before any conditional returns
  const {
    /*data: profileData,*/ error: profileError,
    loading: profileLoading,
  } = useQuery(GET_USER_PROFILE, {
    variables: { userId: userId },
    skip: !userId, // Skip the query if user is not loaded yet
  });

  if (profileError) {
    console.error("Error fetching user profile:", profileError);
  }

  useEffect(() => {
    if (!userId) {
      router.push("/sign-in");
    }
  }, [userId, router]);

  return (
    <ApolloProvider client={client}>
      <LoadingAnimation isLoading={profileLoading} />
      {/* Render Sidebar */}
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
            {userId && (
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

      {/* Navbar */}
      <Navbar currentPath={currentPath ?? "/"} />

      <main className="flex-grow w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="relative max-w-2xl mx-auto bg-white shadow-md rounded-lg p-6">
          <h1 className="text-3xl font-bold mb-6">Settings</h1>
          {/* Profile settings */}
          <h2 className="text-xl font-bold mt-6 mb-4">Profile</h2>
          <div className="flex items-center justify-between">
            <p className="mr-4">Placeholder</p>
            <label className="inline-flex items-center cursor-pointer">
              <input type="checkbox" value="" className="sr-only peer" />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
          {/* Privacy settings */}
          <h2 className="text-xl font-bold mt-6 mb-4">Privacy</h2>
          <div className="flex items-center justify-between">
            <p className="mr-4">Placeholder</p>
            <label className="inline-flex items-center cursor-pointer">
              <input type="checkbox" value="" className="sr-only peer" />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
          {/* Appearance settings*/}
          <h2 className="text-xl font-bold mt-6 mb-4">Appearance</h2>
          <div className="flex items-center justify-between">
            <p className="mr-4">Placeholder</p>
            <label className="inline-flex items-center cursor-pointer">
              <input type="checkbox" value="" className="sr-only peer" />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
          {/* Logout button */}
          <div className="flex items-center justify-center mt-6">
            <SignOutButton>
              <button className="bg-red-500 text-white px-4 py-2 rounded-md">
                Logout
              </button>
            </SignOutButton>
          </div>
        </div>
      </main>
    </ApolloProvider>
  );
}
