'use client'

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { useQuery, gql, useMutation, useApolloClient } from '@apollo/client';
import { decodeId } from '@/utils/idObfuscation';
import Post from '@/components/ui/post';
import LoadingAnimation from '@/components/LoadingAnimation';
import { Navbar } from '@/components/Navbar';
import SuggestionPane from '@/components/SuggestionPane';
import { useSidebar } from '@/hooks/useSidebar';
import { useModal } from '@/contexts/ModalContext';
import { FaHome, FaCompass, FaSearch, FaBell, FaUser, FaPoll, FaSignOutAlt, FaPlus } from 'react-icons/fa';
import '@/app/globals.css';
import Link from 'next/link';
import Image from 'next/image';
import { SignOutButton } from '@clerk/nextjs';
import { ObjectId } from "mongodb";

const GET_POST_BY_ID = gql`
  query GetPostById($postId: String!) {
    getPostById(id: $postId) {
      _id
      content
      author {
        preferred_username
        profilePicture
        name
      }
      type
      pollContent {
        question
        type
        options
        min
        max
        votes
      }
      createdAt
      likes
      comments
    }
  }
`;

const GET_COMMENT_BY_ID = gql`
  query GetCommentById($commentId: String!) {
    getPostById(id: $commentId) {
      _id
      content
      author {
        preferred_username
        profilePicture
        name
      }
      type
      createdAt
      likes
      comments
    }
  }
`;

const GET_USER_PROFILE = gql`
  query getUserById($userId: String!) {
    getUserById(_id: $userId) {
      _id
      preferred_username
      profilePicture
      name
      bio
      preferences
      followers
      following
      createdAt
      posts
    }
  }
`;

const ADD_COMMENT = gql`
  mutation AddComment($content: String!, $author: String!, $parentPost: String!, $createdAt: String!) {
    addComment(
      content: $content
      author: $author
      parentPost: $parentPost
      createdAt: $createdAt
    ) {
      _id
      content
      author {
        preferred_username
        profilePicture
      }
      createdAt
    }
  }
`;

interface PostContentProps {
  username: string;
  encodedPostId: string;
}

interface PollContentType {
  _id: string;
  question: string;
  options: string[];
  type: "multiple" | "single" | "slider";
  votes: Record<string, number>;
  createdAt: string;
  min?: number;
  max?: number;
}

interface Post {
  _id: string;
  content: string;
  parentPost?: ObjectId | null;
  author: Author;
  createdAt: string;
  type: "comment" | "poll";
  pollContent?: PollContentType;
  mediaUrls?: string[];
  likes: ObjectId[];
  comments: ObjectId[];
  tags: string[];
  visibility: "public" | "friends" | "private";
}

interface Author {
  _id: string;
  name: string;
  preferred_username: string;
  profilePicture: string;
}

export default function PostContent({ encodedPostId }: PostContentProps) {
  const { userId } = useAuth();
  const router = useRouter();
  const currentPath = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [showSidebarText, setShowSidebarText] = useState(false);
  const { isMobile, setIsMobile } = useSidebar();
  const { openModal } = useModal();
  const client = useApolloClient();

  const objectId = decodeId(encodedPostId);
  const { data, loading: postLoading, error } = useQuery(GET_POST_BY_ID, { 
    variables: { postId: objectId },
    skip: !isAuthorized,
    fetchPolicy: 'network-only',
  });

  const [commentContent, setCommentContent] = useState('');
  const [addComment] = useMutation(ADD_COMMENT);
  const [comments, setComments] = useState<Post[]>([]);

  const handleOpenCreatePollModal = () => {
    openModal('createPoll');
  };

  const getInitialSidebarState = () => {
    if (typeof window !== 'undefined') {
      return window.innerWidth > 768;
    }
    return false;
  };

  useEffect(() => {
    setIsSidebarVisible(getInitialSidebarState());
    setShowSidebarText(window.innerWidth >= 1440);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 768);
      setIsSidebarVisible(width > 768);
      setShowSidebarText(width >= 1440);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsMobile]);

  const { data: profileData, loading: profileLoading } = useQuery(GET_USER_PROFILE, {
    variables: { userId: userId },
    skip: !userId, // Skip the query if user is not loaded yet
    fetchPolicy: 'cache-and-network',
  });

  const post = data?.getPostById;

  useEffect(() => {
    if (!userId) {
      router.replace('/sign-in');
    } else {
        setIsAuthorized(true);
    }
  }, [userId, router]);

  useEffect(() => {
    if (post && post.comments) {
      fetchComments(post.comments);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post]);

  if (!userId || profileLoading || !isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingAnimation isLoading={true} />
      </div>
    );
  }

  if (error) {
    console.error('Error fetching post:', error);
    return <p className="text-center text-red-500">Failed to load post.</p>;
  }

  const mainContentStyle: React.CSSProperties = {
    marginLeft: isSidebarVisible ? (showSidebarText ? '16rem' : '5rem') : '0',
    width: isSidebarVisible ? (showSidebarText ? 'calc(100% - 16rem)' : 'calc(100% - 5rem)') : '100%',
    maxWidth: '100%',
    overflowX: 'hidden',
  };

  const fetchComments = async (commentIds: string[]) => {
    try {
      const fetchedComments = await Promise.all(
        commentIds.map(async (commentId) => {
          const { data } = await client.query({
            query: GET_COMMENT_BY_ID,
            variables: { commentId },
          });
          return data.getPostById;
        })
      );
      setComments(fetchedComments);
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  const handleAddComment = async () => {
    if (!commentContent.trim()) return;

    try {
      await addComment({
        variables: {
          content: commentContent,
          author: userId,
          parentPost: objectId,
          createdAt: new Date().toISOString(),
        },
        refetchQueries: [{ query: GET_POST_BY_ID, variables: { postId: objectId } }],
      });
      setCommentContent('');
      // Refresh the page to update the comments
      router.refresh();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <LoadingAnimation isLoading={postLoading} />
      {isSidebarVisible && (
        <nav className={`fixed left-0 top-0 h-full bg-white shadow-md transition-all duration-300 ease-in-out ${showSidebarText ? 'w-64' : 'w-20'}`}>
          <div className="flex flex-col h-full">
            <Link href="/" className={`flex items-center p-4 ${showSidebarText ? 'justify-start h-16' : 'justify-center h-20'}`}>
              <Image
                className={`w-auto ${showSidebarText ? 'h-12' : 'h-8'}`}
                src="/logo.png"
                alt="PollUp Logo"
                width={128}
                height={128}
              />
            </Link>
            <div className="flex-grow">
              {[
                { href: "/", icon: FaHome, text: "Home" },
                { href: "/explore", icon: FaCompass, text: "Explore" },
                { onClick: handleOpenCreatePollModal, icon: FaPoll, text: "Create Poll" },
                { href: "/search", icon: FaSearch, text: "Search" },
                { href: "/notifications", icon: FaBell, text: "Notifications" },
                { href: "/profile", icon: FaUser, text: "Profile" },
              ].map((item, index) => (
                item.onClick ? (
                  <button 
                    key={index}
                    onClick={item.onClick}
                    className={`flex items-center p-4 text-sm hover:bg-gray-100 ${
                      showSidebarText ? 'justify-start w-full' : 'justify-center h-20 w-full'
                    } ${
                      currentPath === item.href ? 'text-blue-500' : 'text-gray-600 hover:text-blue-500'
                    }`}
                  >
                    <item.icon size={24} />
                    {showSidebarText && <span className="ml-4">{item.text}</span>}
                  </button>
                ) : (
                  <Link 
                    key={index} 
                    href={item.href} 
                    className={`flex items-center p-4 text-sm hover:bg-gray-100 ${
                      showSidebarText ? 'justify-start' : 'justify-center h-20'
                    } ${
                      currentPath === item.href ? 'bg-gray-100 text-blue-500' : 'text-gray-600 hover:text-blue-500'
                    }`}
                  >
                    <item.icon size={24} />
                    {showSidebarText && <span className="ml-4">{item.text}</span>}
                  </Link>
                )
              ))}
            </div>
            {userId && (
              <div className="p-4">
                <SignOutButton>
                  <button className={`flex items-center text-sm text-red-500 hover:text-red-600 ${showSidebarText ? 'justify-start' : 'justify-center w-full h-20'}`}>
                    <FaSignOutAlt size={24} />
                    {showSidebarText && <span className="ml-2">Logout</span>}
                  </button>
                </SignOutButton>
              </div>
            )}
          </div>
        </nav>
      )}

      <Navbar currentPath={currentPath ?? '/'} />

      <main className="flex-grow w-full px-4 sm:px-6 lg:px-8 py-8" style={mainContentStyle}>
        <div className="flex justify-center space-x-4 lg:space-x-8 max-w-7xl mx-auto">
          <div className="flex-grow max-w-2xl">
            {post ? (
              <>
                <Post post={post} />
                {/* Add Comment Form */}
                <div className="mt-6 bg-white rounded-lg shadow p-4">
                  <div className="flex items-start space-x-4">
                    <Image
                      src={profileData?.getUserById.profilePicture || '/default-avatar.png'}
                      alt="User Avatar"
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                    <div className="flex-grow">
                      <textarea
                        className="w-full p-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={2}
                        placeholder="Add a comment..."
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                      ></textarea>
                    </div>
                    <button
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
                      onClick={handleAddComment}
                    >
                      Post
                    </button>
                  </div>
                </div>
                {/* Comments Section */}
                <div className="mt-6">
                  <h2 className="text-xl font-semibold mb-4">Comments</h2>
                  {comments.length > 0 ? (
                    comments.map((comment) => (
                      <Post key={comment._id} post={comment} />
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No comments yet.</p>
                  )}
                </div>
              </>
            ) : (
              <p className="text-center text-red-500">Post not found</p>
            )}
          </div>
          
          {!isMobile && (
            <div className="hidden lg:block w-80">
              <SuggestionPane />
            </div>
          )}
        </div>
      </main>

      {isMobile && (
        <button onClick={() => openModal('createPoll')} className="fixed bottom-20 right-4 z-50 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 shadow-lg transition-colors duration-200">
          <FaPlus size={24} />
        </button>
      )}
    </div>
  );
}
