import { Suspense } from 'react';
import { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import PostContent from './PostContent';
import { GET_POST_BY_ID } from '@/types/post';
import { decodeId } from '@/utils/idObfuscation';
import { getClient } from '@/lib/apolloClient';

interface PageProps {
  params: { username: string; postid: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username, postid: encodedPostId } = params;
  const post = await fetchPostData(encodedPostId);
  
  return {
    title: `${post.title || 'Post'} by ${username} | PollUp`,
    description: post.content?.substring(0, 200) || 'Check out this post on PollUp',
    openGraph: {
      title: `${post.title || 'Post'} by ${username} | PollUp`,
      description: post.content?.substring(0, 200) || 'Check out this post on PollUp',
      url: `${process.env.NEXT_PUBLIC_APP_URL}/${username}/posts/${encodedPostId}`,
      images: [
        {
          url: post.mediaUrls?.[0] || '/logo.png',
          width: 1200,
          height: 630,
          alt: 'Post preview',
        },
      ],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${post.title || 'Post'} by ${username} | PollUp`,
      description: post.content?.substring(0, 200) || 'Check out this post on PollUp',
      images: [post.mediaUrls?.[0] || '/logo.png'],
    },
  };
}

async function fetchPostData(encodedPostId: string) {
  const client = getClient();
  const objectId = decodeId(encodedPostId);
  
  try {
    const { data } = await client.query({
      query: GET_POST_BY_ID,
      variables: { postId: objectId },
    });
    
    return data.getPostById;
  } catch (error) {
    console.error('Error fetching post for metadata:', error);
    return {};
  }
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
