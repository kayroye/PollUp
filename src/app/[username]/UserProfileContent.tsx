"use client";

import { useQuery, gql } from "@apollo/client";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import SuggestionPane from "../../components/SuggestionPane";
import { useSidebar } from "@/hooks/useSidebar";
import LoadingAnimation from "@/components/LoadingAnimation";
import { FaCog, FaArrowRight, FaPencilAlt } from "react-icons/fa";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import Post from "@/components/ui/post";
import { GET_POST_BY_ID, Post as PostType } from "@/types/post";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRef, useEffect, useState, useCallback } from "react";
import { encodeId } from "@/utils/idObfuscation";
import { ObjectId } from "mongodb";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ProfileUser {
  _id: string;
  preferred_username: string;
  profilePicture: string;
  name: string;
  bio: string;
  followers: string[];
  following: string[];
  posts: string[];
}

const GET_USER_BY_USERNAME = `#graphql
  query GetUserByUsername($username: String!) {
    getUserByUsername(username: $username) {
      _id
      preferred_username
      profilePicture
      name
      bio
      followers
      following
      posts
    }
  }
`;

const GET_USER_POSTS = `#graphql
  query GetUserPosts($username: String!, $limit: Int, $offset: Int) {
    getUserPosts(username: $username, limit: $limit, offset: $offset) {
      posts {
        _id
        content
        createdAt
        type
        parentPost
        author {
          _id
          name
          preferred_username
          profilePicture
          followers
          following
          bio
        }
        likes
        comments
        pollContent {
          _id
          question
          type
          options
          min
          max
          votes {
            total
            sum
            average
            options
          }
        }
      }
      totalCount
      hasMore
    }
  }
`;

// Convert the string query to a DocumentNode
const GET_POST_BY_ID_QUERY = gql`${GET_POST_BY_ID}`;

// Add a new component for the reply banner
interface ReplyBannerProps {
  parentPostId: ObjectId;
}

const ReplyBanner = ({ parentPostId }: ReplyBannerProps) => {
  const parentPostIdString = parentPostId.toString();
  const { data, loading } = useQuery(GET_POST_BY_ID_QUERY, {
    variables: { postId: parentPostIdString },
    skip: !parentPostId,
  });

  if (
    loading ||
    !data?.getPostById ||
    data.getPostById.visibility === "deleted"
  )
    return null;

  const parentPost = data.getPostById;
  const encodedId = encodeId(parentPostIdString);

  return (
    <Link
      href={`/${parentPost.author.preferred_username}/posts/${encodedId}`}
      className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-900 rounded-t-lg w-full text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors border-x border-t border-gray-200 dark:border-gray-800"
    >
      <FaArrowRight className="rotate-180" size={14} />
      <span>Replied to @{parentPost.author.preferred_username}&apos;s post</span>
    </Link>
  );
};

// Add new EditProfileDialog component
interface EditProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  profileUser: ProfileUser;
}

const EditProfileDialog = ({ isOpen, onClose, profileUser }: EditProfileDialogProps) => {
  const [name, setName] = useState(profileUser.name);
  const [bio, setBio] = useState(profileUser.bio);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [profilePicture, setProfilePicture] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement profile update logic
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95%] max-w-[400px] p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
        <DialogHeader>
          <DialogTitle className="text-xl text-gray-900 dark:text-white">Edit Profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Bio</label>
            <Input
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself"
              className="w-full bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Profile Picture</label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setProfilePicture(e.target.files?.[0] || null)}
              className="w-full text-sm bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="w-24 bg-white hover:bg-gray-100 dark:bg-transparent dark:hover:bg-gray-800 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-300"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="w-24 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
            >
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default function UserProfileContent({ username }: { username: string }) {
  const currentPath = usePathname();
  const { isMobile } = useSidebar();
  const { user } = useUser();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isLoadingMore = useRef(false);

  // Add state management
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);
  const [posts, setPosts] = useState<PostType[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // Setup Apollo queries without immediately executing them
  const { client } = useQuery(gql`${GET_USER_BY_USERNAME}`, {
    skip: true,
  });

  // Fetch user data and posts
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data
        const userData = await client.query({
          query: gql`${GET_USER_BY_USERNAME}`,
          variables: { username },
        });
        setProfileUser(userData.data?.getUserByUsername);

        // Fetch initial posts
        const postsData = await client.query({
          query: gql`${GET_USER_POSTS}`,
          variables: { username, limit: 10, offset: 0 },
        });

        setPosts(postsData.data?.getUserPosts.posts || []);
        setHasMore(postsData.data?.getUserPosts.hasMore || false);
      } catch (err) {
        setError(err as Error);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [client, username]);

  // Load more posts function
  const loadMorePosts = useCallback(async () => {
    if (isLoadingMore.current || !hasMore) return;

    isLoadingMore.current = true;
    try {
      const result = await client.query({
        query: gql`${GET_USER_POSTS}`,
        variables: {
          username,
          offset: posts.length,
          limit: 10,
        },
      });

      const newPosts = result.data?.getUserPosts.posts || [];
      setPosts((prev) => [...prev, ...newPosts]);
      setHasMore(result.data?.getUserPosts.hasMore);
    } catch (err) {
      console.error(err);
    } finally {
      isLoadingMore.current = false;
    }
  }, [client, username, posts.length, hasMore]);

  // Scroll effect for infinite loading
  useEffect(() => {
    const scrollArea = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    );

    const handleScroll = () => {
      if (!scrollArea) return;

      const scrollPosition = scrollArea.scrollTop;
      const scrollHeight = scrollArea.scrollHeight;
      const clientHeight = scrollArea.clientHeight;

      if (scrollHeight - (scrollPosition + clientHeight) < 100) {
        loadMorePosts();
      }
    };

    scrollArea?.addEventListener("scroll", handleScroll);
    return () => scrollArea?.removeEventListener("scroll", handleScroll);
  }, [posts.length, hasMore, loadMorePosts]);

  if (error) {
    return (
      <ProtectedLayout currentPath={currentPath ?? "/"}>
        <p className="text-center text-red-500">Error: {error?.message}</p>
      </ProtectedLayout>
    );
  }

  if (!profileUser) {
    if (loading) {
      return (
        <ProtectedLayout currentPath={currentPath ?? "/"}>
          <LoadingAnimation isLoading={true} />
        </ProtectedLayout>
      );
    }
    return (
      <ProtectedLayout currentPath={currentPath ?? "/"}>
        <p className="text-center">User not found</p>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout currentPath={currentPath ?? `/`}>
      <LoadingAnimation isLoading={loading} />
      <div className="flex justify-between max-w-7xl mx-auto h-[calc(100vh-4rem)]">
        {/* Profile Content */}
        <div className="flex-grow lg:mr-4 xl:mr-8 h-full">
          <ScrollArea className="h-full dark:bg-black" ref={scrollAreaRef}>
            <div className="bg-white dark:bg-black shadow-md dark:shadow-none rounded-lg p-4 sm:p-6 mb-6 border border-gray-200 dark:border-gray-800">
              <div className="relative">
                {profileUser?.preferred_username === user?.username && (
                  <div className="absolute top-0 right-0 flex gap-2">
                    <button
                      onClick={() => setIsEditProfileOpen(true)}
                      className="p-4 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-blue-500 dark:hover:text-blue-400 rounded-lg transition-colors duration-200"
                    >
                      <FaPencilAlt size={24} />
                    </button>
                    <Link
                      href="/settings"
                      className="p-4 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-blue-500 dark:hover:text-blue-400 rounded-lg transition-colors duration-200"
                    >
                      <FaCog size={24} />
                    </Link>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                  <Image
                    src={profileUser?.profilePicture || "/default_avatar.png"}
                    alt="Profile Picture"
                    width={100}
                    height={100}
                    className="rounded-full w-24 h-24 sm:w-32 sm:h-32"
                  />
                  <div className="flex flex-col items-center sm:items-start flex-grow">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                      {profileUser?.name}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      @{profileUser?.preferred_username}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 mt-2 text-center sm:text-left">
                      {profileUser?.bio}
                    </p>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-2">
                      <span className="text-gray-600 dark:text-gray-400">
                        Times Posted: {profileUser?.posts?.length || 0}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        Followers: {profileUser?.followers?.length || 0}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        Following: {profileUser?.following?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Posts Section */}
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Recent Posts
            </h3>
            <div className="space-y-6">
              {posts?.length > 0 ? (
                <>
                  {posts.map((post: PostType, index: number) => (
                    <div
                      key={post._id}
                      className={`${index === posts.length - 1 ? "pb-[30px]" : ""} ${
                        post.type === "comment" && post.parentPost ? "flex flex-col -space-y-1" : ""
                      }`}
                    >
                      {post.type === "comment" && post.parentPost && (
                        <ReplyBanner parentPostId={post.parentPost} />
                      )}
                      <Post post={post} />
                    </div>
                  ))}

                  {/* Load more trigger div */}
                  <div ref={loadMoreRef} className="h-10">
                    {loading && (
                      <p className="text-center text-gray-500 dark:text-gray-400">
                        Loading more posts...
                      </p>
                    )}
                  </div>

                  {!hasMore && (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                      Looks like we&apos;ve reached the end!
                    </p>
                  )}
                </>
              ) : (
                <p className="text-gray-600 dark:text-gray-400 text-center">
                  No posts yet
                </p>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Suggestion Pane */}
        {!isMobile && (
          <div className="hidden lg:block lg:w-80 mt-6 lg:mt-0">
            <SuggestionPane />
          </div>
        )}
      </div>
      {profileUser?.preferred_username === user?.username && (
        <EditProfileDialog
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          profileUser={profileUser}
        />
      )}
    </ProtectedLayout>
  );
}
