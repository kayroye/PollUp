import { Suspense } from 'react';
import { Navbar } from '@/components/Navbar';
import PostContent from './PostContent';

interface PageProps {
  params: { username: string; postid: string };
}

export default function PostPage({ params }: PageProps) {
  const { username, postid: encodedPostId } = params;

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-black">
      <Navbar currentPath={`/${username}/posts/${encodedPostId}`} />

      <main className="flex-grow w-full px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<div>Loading...</div>}>
          <PostContent username={username} encodedPostId={encodedPostId} />
        </Suspense>
      </main>
    </div>
  );
}
