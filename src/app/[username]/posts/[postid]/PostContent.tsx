"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/ClerkAuthContext";
import { useQuery, useMutation, useApolloClient, gql } from "@apollo/client";
import { decodeId } from "@/utils/idObfuscation";
import Post from "@/components/ui/post";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import SuggestionPane from "@/components/SuggestionPane";
import { useSidebar } from "@/hooks/useSidebar";
import {
  GET_POST_BY_ID,
  GET_COMMENT_BY_ID,
  ADD_COMMENT,
  Post as PostType,
} from "@/types/post";
import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import LoadingAnimation from "@/components/LoadingAnimation";
import { CREATE_NOTIFICATION } from "@/types/notifications";

interface PostContentProps {
  username: string;
  encodedPostId: string;
}

const GET_USER_PROFILE = `#graphql
  query getUserById($userId: String!) {
    getUserById(_id: $userId) {
      _id
      preferred_username
      profilePicture
      name
    }
  }
`;

const GET_USER_BY_USERNAME = `#graphql
  query GetUserByUsername($username: String!) {
    getUserByUsername(username: $username) {
      _id
      preferred_username
    }
  }
`;

export default function PostContent({ encodedPostId }: PostContentProps) {
  const { userId } = useAuth();
  const currentPath = usePathname();
  const { isMobile } = useSidebar();
  const client = useApolloClient();
  const [commentContent, setCommentContent] = useState("");
  const [comments, setComments] = useState<PostType[]>([]);

  const objectId = decodeId(encodedPostId);
  const {
    data,
    error,
    loading: postLoading,
  } = useQuery(gql`${GET_POST_BY_ID}`, {
    variables: { postId: objectId },
    fetchPolicy: "network-only",
  });

  const { data: profileData } = useQuery(gql`${GET_USER_PROFILE}`, {
    variables: { userId: userId },
    skip: !userId,
    fetchPolicy: "cache-and-network",
  });

  const [addComment] = useMutation(gql`${ADD_COMMENT}`);

  let post = data?.getPostById;
  const [commentLoading, setCommentLoading] = useState(false);

  if(post && post.visibility === "deleted") {
    post = null;
  }

  const fetchComments = async (commentIds: string[]) => {
    try {
      setCommentLoading(true);
      const fetchedComments = await Promise.all(
        commentIds.map(async (commentId) => {
          const { data } = await client.query({
            query: gql`${GET_COMMENT_BY_ID}`,
            variables: { commentId },
          });
          return {
            ...data.getPostById,
            type: "comment",
            likes: data.getPostById.likes || [],
            comments: data.getPostById.comments || [],
            tags: data.getPostById.tags || [],
            visibility: data.getPostById.visibility || "public",
          };
        })
      );
      const sortedComments = fetchedComments.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setComments(sortedComments);
    } catch (err) {
      console.error("Error fetching comments:", err);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentContent.trim()) return;

    try {
      const { data: commentData } = await addComment({
        variables: {
          content: commentContent,
          author: userId,
          parentPost: objectId,
          createdAt: new Date().toISOString(),
          visibility: "public",
          mediaUrls: [],
          tags: [],
        },
        refetchQueries: [
          { query: gql`${GET_POST_BY_ID}`, variables: { postId: objectId } },
        ],
      });
      
      setCommentContent("");
      
      if (post && post.author.preferred_username !== profileData?.getUserById.preferred_username) {
        const { data: authorData } = await client.query({
          query: gql`${GET_USER_BY_USERNAME}`,
          variables: { username: post.author.preferred_username },
        });

        if (authorData?.getUserByUsername._id) {
          await client.mutate({
            mutation: gql`${CREATE_NOTIFICATION}`,
            variables: {
              userId: authorData.getUserByUsername._id,
              type: "comment",
              actorId: userId,
              entityId: commentData.addComment._id,
            },
          });
        }
      }

      if (post && post.comments) {
        fetchComments(post.comments);
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  useEffect(() => {
    if (post && post.comments) {
      fetchComments(post.comments);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post]);

  // Combine loading states
  const isLoading = postLoading || commentLoading;

  if (error) {
    console.error("Error fetching post:", error);
    return (
      <ProtectedLayout currentPath={currentPath ?? "/"}>
        <p className="text-center text-red-500">Failed to load post.</p>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout currentPath={currentPath ?? "/"}>
      <LoadingAnimation isLoading={isLoading} />
      <div className="flex justify-between max-w-7xl mx-auto h-[calc(100vh-4rem)]">
        {/* Main Content */}
        <div className="flex-grow lg:mr-4 xl:mr-8 h-full">
          <ScrollArea className="h-full dark:bg-black">
            {post ? (
              <>
                <Post post={post} />
                {/* Add Comment Form */}
                <div className="mt-6 bg-white dark:bg-black rounded-lg shadow-md dark:shadow-none border border-gray-200 dark:border-gray-800 p-4">
                  <div className="flex items-start space-x-4">
                    <Image
                      src={
                        profileData?.getUserById.profilePicture ||
                        "/default_avatar.png"
                      }
                      alt="User Avatar"
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                    <div className="flex-grow">
                      <textarea
                        className="w-full p-2 border rounded-lg resize-none 
                                 bg-white dark:bg-black
                                 border-gray-200 dark:border-gray-800 
                                 text-gray-900 dark:text-white 
                                 placeholder:text-gray-500 dark:placeholder:text-gray-400
                                 focus:outline-none focus:ring-2 
                                 focus:ring-blue-500 dark:focus:ring-blue-400
                                 focus:border-transparent"
                        rows={2}
                        placeholder="Add a comment..."
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                      ></textarea>
                    </div>
                    <button
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 
                               dark:bg-blue-600 dark:hover:bg-blue-700 
                               text-white rounded-lg 
                               transition-colors duration-200"
                      onClick={handleAddComment}
                    >
                      Post
                    </button>
                  </div>
                </div>
                {/* Comments Section */}
                <div className="mt-6">
                  <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                    Comments
                  </h2>
                  <div className="space-y-6">
                    {comments.length > 0 ? (
                      <>
                        {comments.map((comment, index) => (
                          <div key={comment._id} className={index === comments.length - 1 ? 'pb-[30px]' : ''}>
                            <Post post={comment} />
                          </div>
                        ))}
                      </>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                        No comments yet.
                      </p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-center text-red-500 dark:text-red-400">
                Post not found
              </p>
            )}
          </ScrollArea>
        </div>

        {/* Suggestion Pane */}
        {!isMobile && (
          <div className="hidden lg:block lg:w-80 mt-6 lg:mt-0">
            <SuggestionPane />
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
