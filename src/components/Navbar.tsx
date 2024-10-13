import Link from 'next/link';
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext';
import { FaHome, FaCompass, FaSearch, FaBell, FaUser } from 'react-icons/fa';

export function Navbar() {
  const { user, signOut } = useAuth();

  return (
    <>
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="hidden sm:flex">
              <Link href="/" className="flex-shrink-0 flex items-center">
                <Image
                  className="h-12 w-auto"
                  src="/logo.png"
                  alt="PollUp Logo"
                  width={128}
                  height={128}
                />
              </Link>
              <div className="ml-6 flex space-x-8">
                <NavLink href="/">Home</NavLink>
                <NavLink href="/explore">Explore</NavLink>
                <NavLink href="/create">Create Poll</NavLink>
                {user && <NavLink href="/profile">Profile</NavLink>}
              </div>
            </div>
            <div className="sm:hidden flex justify-center items-center w-full">
              <Link href="/" className="flex-shrink-0 flex items-center">
                <Image
                  className="h-12 w-auto"
                  src="/logo.png"
                  alt="PollUp Logo"
                  width={128}
                  height={128}
                />
              </Link>
            </div>
            <div className="hidden sm:flex sm:items-center">
              {user ? (
                <>
                  <span className="mr-4">Welcome, {user.name}</span>
                  <button onClick={signOut} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
                    Logout
                  </button>
                </>
              ) : (
                <Link href="/login" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
      
      {/* Mobile bottom navigation */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg">
        <div className="flex justify-around items-center h-16">
          <BottomNavLink href="/" icon={<FaHome size={24} />} />
          <BottomNavLink href="/explore" icon={<FaCompass size={24} />} />
          <BottomNavLink href="/search" icon={<FaSearch size={24} />} />
          <BottomNavLink href="/notifications" icon={<FaBell size={24} />} />
          <BottomNavLink href="/profile" icon={<FaUser size={24} />} />
        </div>
      </div>
    </>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
      {children}
    </Link>
  );
}

function BottomNavLink({ href, icon }: { href: string; icon: React.ReactNode }) {
  return (
    <Link href={href} className="text-gray-600 hover:text-blue-500 flex flex-col items-center">
      {icon}
    </Link>
  );
}
