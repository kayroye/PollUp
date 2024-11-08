import { Suspense } from 'react';
import { Navbar } from '../../components/Navbar';
import UserProfileContent from './UserProfileContent';


interface PageProps {
  params: { username: string }
}

export default function UserProfile({ params }: PageProps) {
  const { username } = params;

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-black">
      <Navbar currentPath={`/${username}`} />

      <main className="flex-grow w-full px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<div>Loading...</div>}>
          <UserProfileContent username={username} />
        </Suspense>
      </main>
    </div>
  );
}
