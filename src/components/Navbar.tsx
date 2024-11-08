"use client";

import Link from "next/link";
import { FaHome, FaSearch, FaBell, FaUser, FaPlus } from "react-icons/fa";
import { useSidebar } from "../hooks/useSidebar";
import Image from "next/image";
import { useModal } from "../contexts/ModalContext";

interface NavbarProps {
  currentPath: string;
  onLogoClick?: () => void;
}

export function Navbar({ currentPath, onLogoClick }: NavbarProps) {
  const { isMobile } = useSidebar();
  const { openModal } = useModal();

  const handleLogoClick = () => {
    onLogoClick?.();
    window.location.href = "/";
  };

  const handleOpenCreatePollModal = () => {
    openModal("createPoll");
  };

  return (
    <>
      {isMobile && (
        <>
          <div className="fixed top-0 left-0 right-0 bg-white dark:bg-black z-50 flex items-center justify-center h-14 border-b border-gray-200 dark:border-gray-800">
            <button
              onClick={handleLogoClick}
              className="flex items-center justify-center h-14"
            >
              <Image
                src="/logo.png"
                alt="PollUp Logo"
                width={128}
                height={128}
                className="h-10 w-auto"
              />
            </button>
          </div>
          <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-black shadow-lg dark:shadow-none border-t border-transparent dark:border-gray-800 z-50">
            <div className="flex justify-around items-center h-16">
              <BottomNavLink
                href="/"
                icon={<FaHome size={24} />}
                isActive={currentPath === "/"}
              />
              <BottomNavLink
                href="/discover"
                icon={<FaSearch size={24} />}
                isActive={currentPath === "/discover"}
              />

              <button
                onClick={handleOpenCreatePollModal}
                className="flex flex-col items-center text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
              >
                <FaPlus size={24} />
              </button>

              <BottomNavLink
                href="/notifications"
                icon={<FaBell size={24} />}
                isActive={currentPath === "/notifications"}
              />
              <BottomNavLink
                href="/profile"
                icon={<FaUser size={24} />}
                isActive={currentPath === "/profile"}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}

interface BottomNavLinkProps {
  href: string;
  icon: React.ReactNode;
  isActive: boolean;
}

function BottomNavLink({ href, icon, isActive }: BottomNavLinkProps) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center ${
        isActive
          ? "text-blue-500 dark:text-blue-400"
          : "text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
      }`}
    >
      {icon}
    </Link>
  );
}
