'use client'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import LoadingAnimation from '../components/LoadingAnimation';
import { Navbar } from '../components/Navbar';

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
    }
  }, [user, loading, router, showLoading]);

  if (showLoading || loading) {
    return <LoadingAnimation />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-6">Welcome to PollUp, {user?.preferred_username || user?.email}!</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Polls</h2>
            {/* Add recent polls content here */}
            <p>No recent polls available.</p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Popular Categories</h2>
            {/* Add popular categories content here */}
            <p>No categories available.</p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Your Activity</h2>
            {/* Add user activity content here */}
            <p>No recent activity.</p>
          </div>
        </div>
      </main>
    </div>
  );
}