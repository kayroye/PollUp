'use client'

import Link from 'next/link';
import { FaHome, FaSearch, FaBell, FaUser } from 'react-icons/fa';
import { useSidebar } from '../hooks/useSidebar';
import Image from 'next/image';

interface NavbarProps {
  currentPath: string;
  onLogoClick?: () => void;
}

export function Navbar({ currentPath, onLogoClick }: NavbarProps) {
  const { isMobile } = useSidebar();

  const handleLogoClick = () => {
    onLogoClick?.();
    window.location.href = '/';
  };

  return (
    <>
      {isMobile && (
        <>
          <div className="fixed top-0 left-0 right-0 bg-white z-50 flex items-center justify-center h-14 border-b border-gray-200">
            <button onClick={handleLogoClick} className="flex items-center justify-center h-14">
              <Image
                src="/logo.png"
                alt="PollUp Logo"
                width={128}
                height={128}
                className="h-10 w-auto"
              />
            </button>
          </div>
          <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg z-50">
            <div className="flex justify-around items-center h-16">
              <BottomNavLink href="/" icon={<FaHome size={24} />} isActive={currentPath === '/'} />
              <BottomNavLink href="/discover" icon={<FaSearch size={24} />} isActive={currentPath === '/discover'} />
              <BottomNavLink href="/notifications" icon={<FaBell size={24} />} isActive={currentPath === '/notifications'} />
              <BottomNavLink href="/profile" icon={<FaUser size={24} />} isActive={currentPath === '/profile'} />
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
    <Link href={href} className={`flex flex-col items-center ${isActive ? 'text-blue-500' : 'text-gray-600 hover:text-blue-500'}`}>
      {icon}
    </Link>
  );
}
