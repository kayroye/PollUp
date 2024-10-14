import Link from 'next/link';
import { FaHome, FaCompass, FaSearch, FaBell, FaUser, } from 'react-icons/fa';
import { useSidebar } from '../hooks/useSidebar';

export function Navbar() {
  const { isMobile } = useSidebar();

  return (
    <>
      {/* Sidebar for desktop */}
      {/* Sidebar logic moved to homepage */}
      null
      
      {/* Mobile bottom navigation */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg">
          <div className="flex justify-around items-center h-16">
            <BottomNavLink href="/" icon={<FaHome size={24} />} />
            <BottomNavLink href="/explore" icon={<FaCompass size={24} />} />
            <BottomNavLink href="/search" icon={<FaSearch size={24} />} />
            <BottomNavLink href="/notifications" icon={<FaBell size={24} />} />
            <BottomNavLink href="/profile" icon={<FaUser size={24} />} />
          </div>
        </div>
      )}
    </>
  );
}

function BottomNavLink({ href, icon }: { href: string; icon: React.ReactNode }) {
  return (
    <Link href={href} className="text-gray-600 hover:text-blue-500 flex flex-col items-center">
      {icon}
    </Link>
  );
}
