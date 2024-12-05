import { Suspense } from 'react';
import { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import PostContent from './PostContent';
import { GET_POST_BY_ID } from '@/types/post';
import { decodeId } from '@/utils/idObfuscation';
import { getClient } from '@/lib/apolloClient';
import { gql } from '@apollo/client';

interface PageProps {
  params: { username: string; postid: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { postid: encodedPostId } = params;
  
  try {
    const post = await fetchPostData(encodedPostId);
    
    if (!post || Object.keys(post).length === 0) {
      return {
        title: 'Post | PollUp',
        description: 'Check out this post on PollUp',
      };
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pollup-v1-dev.vercel.app/';
    
    const postTitle = post.title || 'Post';
    const displayTitle = `${postTitle} by ${params.username}`;
    const postDescription = post.content?.substring(0, 200) || 'Check out this post on PollUp';
    const postUrl = `${baseUrl}/${params.username}/posts/${encodedPostId}`;
    const imageUrl = post.mediaUrls?.[0] || `${baseUrl}/logo.png`;

    return {
      title: `${displayTitle} | PollUp`,
      description: postDescription,
      metadataBase: new URL(baseUrl),
      openGraph: {
        title: displayTitle,
        description: postDescription,
        url: postUrl,
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: 'Post preview',
          },
        ],
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title: displayTitle,
        description: postDescription,
        images: [imageUrl],
      },
    };
  } catch {
    return {
      title: 'PollUp',
      description: 'Create and share polls with your friends',
      metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://pollup-v1-dev.vercel.app/'),
    };
  }
}

async function fetchPostData(encodedPostId: string) {
  const client = getClient();
  const objectId = decodeId(encodedPostId);
  
  if (typeof window === 'undefined') {
    try {
      const { data } = await client.query({
        query: gql`${GET_POST_BY_ID}`,
        variables: { postId: objectId },
      });
      return data?.getPostById || null;
    } catch {
      return null;
    }
  }

  const retry = async (attempts: number = 2, delay: number = 1000) => {
    for (let i = 0; i < attempts; i++) {
      try {
        const { data } = await client.query({
          query: gql`${GET_POST_BY_ID}`,
          variables: { postId: objectId },
          context: {
            headers: {
              'Accept': 'application/json',
            }
          }
        });
        
        if (data?.getPostById) {
          return data.getPostById;
        }
      } catch {
        if (i < attempts - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    return null;
  };

  try {
    const result = await retry();
    if (!result) {
      return {};
    }
    return result;
  } catch {
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
