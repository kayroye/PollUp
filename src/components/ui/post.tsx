//import PollContent from '../PollContent';
import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { ObjectId } from "mongodb";
import Link from "next/link";
import { encodeId } from "@/utils/idObfuscation";
import {
  Heart,
  MessageCircle,
  Share,
  MoreVertical,
  Trash2,
  Flag,
} from "lucide-react";
import { gql } from "@apollo/client";
import client from "@/lib/apolloClient";
import { useUser } from "@clerk/nextjs";
import { useAuth } from "@/contexts/ClerkAuthContext";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "./hover-card";
import { Avatar, AvatarImage } from "./avatar";
import { AnimatePresence } from "framer-motion";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "./alert-dialog";
import { DELETE_POST } from "@/types/post";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

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

interface PostProps {
  post: {
    _id: string;
    content: string;
    author: Author;
    createdAt: string;
    type: string;
    pollContent?: PollContentType;
    mediaUrls?: string[];
    likes: ObjectId[];
    comments: ObjectId[];
    tags: string[];
    visibility: string;
  };
}

interface Author {
  name: string;
  preferred_username: string;
  profilePicture: string;
  bio: string;
  followers: ObjectId[];
  following: ObjectId[];
}

const Post: React.FC<PostProps> = ({ post }) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [sliderValue, setSliderValue] = useState<number | null>(null);
  const { isLoaded, isSignedIn, user } = useUser();
  const { userId } = useAuth();
  const [, updateState] = useState({});
  const forceUpdate = useCallback(() => updateState({}), []);
  const [showMenu, setShowMenu] = useState(false);
  const [isHoverCardOpen, setIsHoverCardOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  let likes = post.likes.length;

  const ADD_OR_REMOVE_LIKE = gql`
    mutation AddOrRemoveLike(
      $targetId: String!
      $userId: String!
      $onWhat: LikeTarget!
    ) {
      addOrRemoveLike(targetId: $targetId, userId: $userId, onWhat: $onWhat) {
        ... on Post {
          _id
          likes
        }
      }
    }
  `;

  const handleOptionChange = (option: string) => {
    if (post.pollContent && post.pollContent.type === "single") {
      setSelectedOptions([option]);
    } else {
      setSelectedOptions((prev) =>
        prev.includes(option)
          ? prev.filter((o) => o !== option)
          : [...prev, option]
      );
    }
  };

  const renderPollOptions = () => {
    if (post.pollContent?.type === "slider") {
      return (
        <div className="mt-4">
          <input
            type="range"
            id={`slider-${post._id}`}
            min={post.pollContent.min || 0}
            max={post.pollContent.max || 100}
            value={
              sliderValue !== null ? sliderValue : post.pollContent.min || 0
            }
            onChange={(e) => setSliderValue(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between mt-2">
            <span>{post.pollContent.min || 0}</span>
            <span>{sliderValue !== null ? sliderValue : "Select a value"}</span>
            <span>{post.pollContent.max || 100}</span>
          </div>
        </div>
      );
    }

    return post.pollContent?.options.map((option, index) => (
      <div key={index} className="flex items-center mb-2">
        <input
          type={post.pollContent?.type === "single" ? "radio" : "checkbox"}
          id={`option-${post._id}-${index}`}
          name={`poll-${post._id}`}
          value={option}
          checked={selectedOptions.includes(option)}
          onChange={() => handleOptionChange(option)}
          className="mr-2"
        />
        <label htmlFor={`option-${post._id}-${index}`} className="flex-grow">
          {option}
        </label>
        <span className="text-gray-500">
          {post.pollContent?.votes[option] || 0} votes
        </span>
      </div>
    ));
  };

  const isLiked = userId
    ? post.likes.some((id) => id.toString() === userId)
    : false;

  const handleLike = async () => {
    if (!isLoaded || !isSignedIn) {
      return;
    }

    // Optimistically update the UI
    const wasLiked = isLiked;
    const newLikes = wasLiked 
      ? post.likes.filter(id => id.toString() !== userId)
      : [...post.likes, { toString: () => userId }];
    
    likes = newLikes.length;
    forceUpdate();

    const variables = { targetId: post._id, userId: userId, onWhat: "post" };
    try {
      const { data } = await client.mutate({
        mutation: ADD_OR_REMOVE_LIKE,
        variables: variables,
      });
      
      if (!data?.addOrRemoveLike) {
        // If mutation fails, revert the optimistic update
        likes = post.likes.length;
        forceUpdate();
      }
    } catch (error) {
      // If there's an error, revert the optimistic update
      likes = post.likes.length;
      forceUpdate();
      console.error("Error adding or removing like:", error);
    }
  };

  // New function to format the time difference
  const formatTimeDifference = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffInSeconds = Math.floor(
      (now.getTime() - created.getTime()) / 1000
    );

    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    if (diffInSeconds < 31536000)
      return `${Math.floor(diffInSeconds / 604800)}w`;
    return `${Math.floor(diffInSeconds / 31536000)}y`;
  };

  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  const handleDeletePost = async () => {
    try {
      const { data } = await client.mutate({
        mutation: DELETE_POST,
        variables: { postId: post._id },
      });
      if (data?.deletePost) {
        setShowMenu(false);
        window.location.reload();
      }
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    setShowDeleteAlert(true);
  };

  return (
    <div className="bg-white dark:bg-black shadow-md dark:shadow-none border border-transparent dark:border-gray-800 rounded-lg p-4 mb-4 w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <HoverCard open={isHoverCardOpen} onOpenChange={setIsHoverCardOpen}>
            <HoverCardTrigger asChild>
              <Link href={`/${post.author.preferred_username}`}>
                <div className="cursor-pointer">
                  <Image
                    src={post.author.profilePicture}
                    alt={`${post.author.name}'s profile`}
                    width={40}
                    height={40}
                    className="rounded-full mr-3"
                  />
                </div>
              </Link>
            </HoverCardTrigger>
            <AnimatePresence>
              {isHoverCardOpen && (
                <HoverCardContent className="w-80">
                  <div className="flex flex-col items-center gap-3">
                    <Avatar className="w-24 h-24">
                      <AvatarImage
                        src={post.author.profilePicture}
                        alt={post.author.name}
                      />
                    </Avatar>
                    <div className="text-center">
                      <h4 className="font-semibold text-lg">
                        {post.author.name}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        @{post.author.preferred_username}
                      </p>
                      <p className="text-sm mt-2">
                        {post.author.followers.length} followers ·{" "}
                        {post.author.following.length} following
                      </p>
                      {post.author.bio && (
                        <p className="text-sm mt-2 text-gray-600 dark:text-gray-300">
                          {post.author.bio}
                        </p>
                      )}
                    </div>
                  </div>
                </HoverCardContent>
              )}
            </AnimatePresence>
          </HoverCard>
          <div>
            <HoverCard>
              <HoverCardTrigger asChild>
                <Link href={`/${post.author.preferred_username}`}>
                  <h3 className="font-bold text-gray-900 dark:text-white hover:underline">
                    {post.author.name}
                  </h3>
                </Link>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="flex flex-col items-center gap-3">
                  <Avatar className="w-24 h-24">
                    <AvatarImage
                      src={post.author.profilePicture}
                      alt={post.author.name}
                    />
                  </Avatar>
                  <div className="text-center">
                    <h4 className="font-semibold text-lg">
                      {post.author.name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      @{post.author.preferred_username}
                    </p>
                    <p className="text-sm mt-2">
                      {post.author.followers.length} followers ·{" "}
                      {post.author.following.length} following
                    </p>
                    {post.author.bio && (
                      <p className="text-sm mt-2 text-gray-600 dark:text-gray-300">
                        {post.author.bio}
                      </p>
                    )}
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
            <span className="text-gray-700 dark:text-gray-300">
              @{post.author.preferred_username}
            </span>
          </div>
        </div>
        <div className="flex items-center">
          <span className="text-sm text-gray-700 dark:text-gray-300 mr-2">
            {formatTimeDifference(post.createdAt)}
          </span>
          <div className="relative" ref={menuRef}>
            <button
              onClick={toggleMenu}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-black rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-800">
                <div className="py-1">
                  {user?.username === post.author.preferred_username && (
                    <Button
                      variant="ghost"
                      className="flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-900 w-full text-left"
                      onClick={handleDeleteClick}
                    >
                      <Trash2 className="mr-2" />
                      Delete
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 w-full text-left"
                  >
                    <Flag className="mr-2" />
                    Report
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="mb-4 text-gray-900 dark:text-white">
        <p className="mb-2">{post.content}</p>
        {post.type === "poll" && (
          <>
            <h4 className="font-bold mb-2">{post.pollContent?.question}</h4>
            <div className="space-y-2">{renderPollOptions()}</div>
          </>
        )}
      </div>
      <div className="flex justify-between items-center text-sm text-gray-700 dark:text-gray-300">
        <div className="flex space-x-2 relative z-0">
          <Button
            variant="ghost"
            size="sm"
            className={`px-2 ${
              isLiked
                ? "text-red-500 dark:text-red-500"
                : "text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
            }`}
            onClick={handleLike}
          >
            <Heart
              className={`transition-transform duration-300 ease-in-out ${
                isLiked ? "fill-current scale-125" : "scale-100"
              }`}
            />
            <span className="ml-1">{likes}</span>
          </Button>
          
          <Link href={`/${post.author.preferred_username}/posts/${encodeId(post._id)}`}>
            <Button
              variant="ghost"
              size="sm"
              className="px-2 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
            >
              <MessageCircle />
              <span className="ml-1">{post.comments.length}</span>
            </Button>
          </Link>
          
          <Button
            variant="ghost"
            size="sm"
            className="px-2 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
          >
            <Share />
          </Button>
        </div>
      </div>
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your post.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex justify-end gap-3">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeletePost}
                className="bg-red-500 hover:bg-red-600 text-white dark:bg-red-600 dark:hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </div>
          </motion.div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Post;
