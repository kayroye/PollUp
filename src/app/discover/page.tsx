"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/ClerkAuthContext";
import LoadingAnimation from "../../components/LoadingAnimation";
import { Navbar } from "../../components/Navbar";
import { ApolloProvider } from "@apollo/client";
import client from "@/lib/apolloClient";
import "@/app/globals.css";
import {
  FaHome,
  FaBell,
  FaUser,
  FaSearch,
  FaPoll,
  FaSignOutAlt,
  FaPlus,
  FaFire,
  FaVoteYea,
  FaGamepad,
  FaFilm,
  FaMicrochip,
  FaFlask,
  FaHamburger,
  FaGlobeAmericas,
} from "react-icons/fa";
import Link from "next/link";
import Image from "next/image";
import { useSidebar } from "@/hooks/useSidebar";
import SuggestionPane from "../../components/SuggestionPane";
import { useModal } from "../../contexts/ModalContext";
import { SignOutButton, useUser } from "@clerk/nextjs";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function Explore() {
  const { userId, isLoading } = useAuth();
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [showSidebarText, setShowSidebarText] = useState(false);
  const { isMobile, setIsMobile } = useSidebar();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const currentPath = usePathname();
  const { openModal } = useModal();
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

    handleResize(); // Set initial state
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setIsMobile]);

  useEffect(() => {
    if (isLoaded && !isSignedIn && !isLoading) {
      router.replace("/sign-in");
    }
  }, [isLoaded, isSignedIn, isLoading, router]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        scrollContainer.scrollLeft += e.deltaY;
      };
      scrollContainer.addEventListener("wheel", handleWheel);
      return () => scrollContainer.removeEventListener("wheel", handleWheel);
    }
  }, []);

  if (!isLoaded || isLoading || !userId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingAnimation isLoading={true} />
      </div>
    );
  }

  // Update mainContentStyle to be more responsive
  const mainContentStyle: React.CSSProperties = {
    marginLeft: isSidebarVisible ? (showSidebarText ? "16rem" : "5rem") : "0",
    width: isSidebarVisible
      ? showSidebarText
        ? "calc(100% - 16rem)"
        : "calc(100% - 5rem)"
      : "100%",
    maxWidth: "100%",
    overflowX: "hidden",
  };

  return (
    <ApolloProvider client={client}>
      <div className="flex flex-col min-h-screen bg-white">
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
                  { href: "/discover", icon: FaSearch, text: "Discover" },
                  {
                    onClick: handleOpenCreatePollModal,
                    icon: FaPoll,
                    text: "Create Poll",
                  },
                  {
                    href: "/notifications",
                    icon: FaBell,
                    text: "Notifications",
                  },
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
                        showSidebarText
                          ? "justify-start"
                          : "justify-center h-20"
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

        <main
          className="flex-grow w-full px-4 sm:px-6 lg:px-8 py-8"
          style={mainContentStyle}
        >
          <div className="flex flex-col lg:flex-row justify-center lg:space-x-8 max-w-7xl mx-auto">
            <div className="flex-grow max-w-full lg:max-w-2xl">
              <h1 className="text-3xl font-bold mb-4 sm:mb-6 text-black">
                Explore Polls
              </h1>

              {/* Search Bar */}
              <div className="relative mb-8">
                <Input
                  type="search"
                  placeholder="Search topics..."
                  className="w-full pl-10"
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>

              {/* Categories Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
                {[
                  { icon: FaFire, label: "Trending", color: "text-orange-500" },
                  {
                    icon: FaVoteYea,
                    label: "Politics",
                    color: "text-blue-500",
                  },
                  {
                    icon: FaGamepad,
                    label: "Gaming",
                    color: "text-purple-500",
                  },
                  {
                    icon: FaFilm,
                    label: "Entertainment",
                    color: "text-pink-500",
                  },
                  {
                    icon: FaMicrochip,
                    label: "Technology",
                    color: "text-gray-500",
                  },
                  { icon: FaFlask, label: "Science", color: "text-green-500" },
                  {
                    icon: FaHamburger,
                    label: "Food",
                    color: "text-yellow-500",
                  },
                  {
                    icon: FaGlobeAmericas,
                    label: "Travel",
                    color: "text-cyan-500",
                  },
                ].map((category, index) => (
                  <Card
                    key={index}
                    className="p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer flex flex-col items-center justify-center aspect-square"
                  >
                    <category.icon
                      className={`text-3xl mb-2 ${category.color}`}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {category.label}
                    </span>
                  </Card>
                ))}
              </div>

              {/* Add polls here */}
              <div className="space-y-6"></div>
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
          <button
            onClick={handleOpenCreatePollModal}
            className="fixed bottom-20 right-4 z-50 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 shadow-lg transition-colors duration-200"
          >
            <FaPlus size={24} />
          </button>
        )}
      </div>
    </ApolloProvider>
  );
}
