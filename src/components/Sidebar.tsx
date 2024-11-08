"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { SignOutButton, useUser } from "@clerk/nextjs";
import { useModal } from "@/contexts/ModalContext";
import { useSidebar } from "@/hooks/useSidebar";
import { gql, useQuery } from "@apollo/client";
import {
  FaHome,
  FaSearch,
  FaBell,
  FaUser,
  FaPlus,
  FaSignOutAlt,
} from "react-icons/fa";

export function Sidebar() {
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [showSidebarText, setShowSidebarText] = useState(false);
  const { setIsMobile, isMobile } = useSidebar();
  const currentPath = usePathname();
  const { openModal } = useModal();
  const { user } = useUser();

  const GET_USER_BY_USERNAME = gql`
  query GetUserByUsername($username: String!) {
    getUserByUsername(username: $username) {
      _id
      profilePicture
    }
  }
`;

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

  const username = user?.username;

  const { data: userData } = useQuery(GET_USER_BY_USERNAME, {
    variables: { username },
    skip: !username,
  });

  if (!isSidebarVisible) return null;

  return (
    <>
      <nav
        className={`fixed left-0 top-0 h-full bg-white dark:bg-black shadow-md dark:shadow-none border-r border-gray-200 dark:border-gray-900 transition-all duration-300 ease-in-out ${
          showSidebarText ? "w-64" : "w-20"
        }`}
      >
        <div className="flex flex-col h-full">
          <Link
            href="/"
            className={`flex items-center ${
              showSidebarText
                ? "justify-start p-4 h-16"
                : "justify-center h-20 p-2"
            }`}
          >
            <Image
              className="w-auto h-12"
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
                onClick: () => openModal("createPoll"),
                icon: FaPlus,
                text: "Create Poll",
              },
              { href: "/notifications", icon: FaBell, text: "Notifications" },
              { 
                href: `/${username}`, 
                icon: () => userData?.getUserByUsername?.profilePicture ? (
                  <Image
                    src={userData.getUserByUsername.profilePicture}
                    alt="Profile"
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                ) : (
                  <FaUser size={24} />
                ),
                text: "Profile" 
              },
            ].map((item, index) =>
              item.onClick ? (
                <button
                  key={index}
                  onClick={item.onClick}
                  className={`flex items-center p-4 text-sm hover:bg-gray-100 dark:hover:bg-gray-900 ${
                    showSidebarText ? "justify-start w-full" : "justify-center h-20 w-full"
                  } ${
                    currentPath === item.href
                      ? "text-blue-500 dark:text-blue-400"
                      : "text-gray-600 dark:text-gray-300"
                  }`}
                >
                  <item.icon size={24} />
                  {showSidebarText && <span className="ml-4">{item.text}</span>}
                </button>
              ) : (
                <Link
                  key={index}
                  href={item.href}
                  className={`flex items-center p-4 text-sm hover:bg-gray-100 dark:hover:bg-gray-900 ${
                    showSidebarText ? "justify-start" : "justify-center h-20"
                  } ${
                    currentPath === item.href
                      ? "bg-gray-100 dark:bg-gray-900 text-blue-500 dark:text-blue-400"
                      : "text-gray-600 dark:text-gray-300"
                  }`}
                >
                  <item.icon size={24} />
                  {showSidebarText && <span className="ml-4">{item.text}</span>}
                </Link>
              )
            )}
          </div>
          {user && (
            <div className="p-4">
              <SignOutButton>
                <button
                  className={`flex items-center text-sm text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-500 ${
                    showSidebarText ? "justify-start" : "justify-center w-full h-20"
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

      {isMobile && (
        <button
          onClick={() => openModal("createPoll")}
          className="fixed bottom-20 right-4 z-50 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-colors duration-200"
          aria-label="Create Poll"
        >
          <FaPlus size={24} />
        </button>
      )}
    </>
  );
}