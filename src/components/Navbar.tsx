'use client'

import Link from 'next/link';
import { FaHome, FaCompass, FaSearch, FaBell, FaUser } from 'react-icons/fa';
import { useSidebar } from '../hooks/useSidebar';

interface NavbarProps {
  currentPath: string;
}

export function Navbar({ currentPath }: NavbarProps) {
  const { isMobile } = useSidebar();

  return (
    <>
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg">
          <div className="flex justify-around items-center h-16">
            <BottomNavLink href="/" icon={<FaHome size={24} />} isActive={currentPath === '/'} />
            <BottomNavLink href="/explore" icon={<FaCompass size={24} />} isActive={currentPath === '/explore'} />
            <BottomNavLink href="/search" icon={<FaSearch size={24} />} isActive={currentPath === '/search'} />
            <BottomNavLink href="/notifications" icon={<FaBell size={24} />} isActive={currentPath === '/notifications'} />
            <BottomNavLink href="/profile" icon={<FaUser size={24} />} isActive={currentPath === '/profile'} />
          </div>
        </div>
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
    <Link href={href} className={`text-gray-600 hover:text-blue-500 flex flex-col items-center ${isActive ? 'text-blue-500' : ''}`}>
      {icon}
    </Link>
  );
}
