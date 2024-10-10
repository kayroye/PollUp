'use client'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import LoadingAnimation from '../components/LoadingAnimation';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showLoading && !loading) {
      if (!user) {
        router.push('/login');
      }
      // else stay on home page
    }
  }, [user, loading, router, showLoading]);

  if (showLoading || loading) {
    return <LoadingAnimation />;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1>Welcome to PollUp, {user?.preferred_username || user?.email}!</h1>
      {/* Add your home page content here */}
    </main>
  );
}