"use client";
import { useRef } from "react";
import { usePathname } from "next/navigation";
import { useQuery } from "@apollo/client";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import Post from "../components/ui/post";
import SuggestionPane from "../components/SuggestionPane";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LIST_POSTS, Post as PostType } from "@/types/post"; // Move types to separate file
import { useSidebar } from "@/hooks/useSidebar";
import LoadingAnimation from "@/components/LoadingAnimation";

export default function Home() {
  const currentPath = usePathname();
  const { isMobile } = useSidebar();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const {
    data,
    loading: postsLoading,
    error: postsError,
  } = useQuery(LIST_POSTS, {
    fetchPolicy: "cache-and-network",
    skip: typeof window === 'undefined',
  });

  if(postsError) {
    console.error(postsError);
  }

  const posts: PostType[] = data?.listPosts || [];
  const filteredPosts = posts.filter((post) => post.type !== "comment");

  return (
    <ProtectedLayout currentPath={currentPath ?? "/"}>
      <LoadingAnimation isLoading={postsLoading} />
      <div className="flex justify-between max-w-7xl mx-auto h-[calc(100vh-4rem)]">
        {postsError ? (
          <p className="text-center text-red-500 dark:text-red-400">Failed to load posts. {postsError.message}</p>
        ) : (
          <>
            <div className="flex-grow lg:mr-4 xl:mr-8 h-full">
              <ScrollArea className="h-full dark:bg-black" ref={scrollAreaRef}>
                <div className="space-y-6">
                  {filteredPosts.length > 0 ? (
                    <>
                      {filteredPosts.map((post: PostType, index: number) => (
                        <div key={post._id} className={index === filteredPosts.length - 1 ? 'pb-[30px]' : ''}>
                          <Post post={post} />
                        </div>
                      ))}
                      <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                        Looks like we&apos;ve reached the end!
                      </p>
                    </>
                  ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400">
                      No posts to display at the moment.
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>

            {!isMobile && (
              <div className="hidden lg:block lg:w-80 mt-6 lg:mt-0">
                <SuggestionPane />
              </div>
            )}
          </>
        )}
      </div>
    </ProtectedLayout>
  );
}
