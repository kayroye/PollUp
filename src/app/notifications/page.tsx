"use client";
import React, { useRef, useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useApolloClient, useQuery } from "@apollo/client";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/ClerkAuthContext";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { GET_NOTIFICATIONS, MARK_NOTIFICATION_READ, Notification } from "@/types/notifications";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import LoadingAnimation from "@/components/LoadingAnimation";
import Image from "next/image";
import { encodeId } from "@/utils/idObfuscation";

export default function Notifications() {
  const { userId } = useAuth();
  const currentPath = usePathname();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const isLoadingMore = useRef(false);
  const client = useApolloClient();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const { loading, error, data, fetchMore } = useQuery(GET_NOTIFICATIONS, {
    variables: {
      userId,
      limit: 10,
      offset: 0,
    },
    skip: !userId,
    onCompleted: (data) => {
      const filteredNotifications = activeTab === "all" 
        ? data.getNotifications.notifications 
        : data.getNotifications.notifications.filter((n: Notification) => n.type === activeTab);
      setNotifications(filteredNotifications);
      setHasMore(data.getNotifications.hasMore);
    },
  });

  useEffect(() => {
    if (data) {
      const filteredNotifications = activeTab === "all"
        ? data.getNotifications.notifications
        : data.getNotifications.notifications.filter((n: Notification) => n.type === activeTab);
      setNotifications(filteredNotifications);
    }
  }, [activeTab, data]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore.current) return;
    isLoadingMore.current = true;
    
    try {
      const result = await fetchMore({
        variables: {
          userId,
          offset: notifications.length,
          limit: 10,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev;
          return {
            getNotifications: {
              ...fetchMoreResult.getNotifications,
              notifications: [
                ...prev.getNotifications.notifications,
                ...fetchMoreResult.getNotifications.notifications
              ],
            },
          };
        },
      });
      
      if (result.data) {
        const newNotifications = activeTab === "all"
          ? result.data.getNotifications.notifications
          : result.data.getNotifications.notifications.filter((n: Notification) => n.type === activeTab);
        
        const uniqueNotifications = Array.from(
          new Set([...notifications, ...newNotifications].map(n => n._id))
        ).map(id => [...notifications, ...newNotifications].find(n => n._id === id));
        
        setNotifications(uniqueNotifications);
        setHasMore(result.data.getNotifications.hasMore);
      }
    } catch (err) {
      console.error("Error fetching more notifications:", err);
    } finally {
      isLoadingMore.current = false;
    }
  }, [fetchMore, hasMore, notifications, activeTab, userId]);

  useEffect(() => {
    if (!userId) return;
    
    const scrollArea = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    );
    
    const handleScroll = () => {
      if (!scrollArea || isLoadingMore.current || !hasMore) {
        return;
      }

      const scrollPosition = scrollArea.scrollTop;
      const scrollHeight = scrollArea.scrollHeight;
      const clientHeight = scrollArea.clientHeight;

      if (scrollHeight - (scrollPosition + clientHeight) < 100) {
        loadMore();
      }
    };

    scrollArea?.addEventListener("scroll", handleScroll);
    
    const timer = setTimeout(() => {
      if (scrollArea) {
        handleScroll();
      }
    }, 1000);

    return () => {
      scrollArea?.removeEventListener("scroll", handleScroll);
      clearTimeout(timer);
    };
  }, [hasMore, loadMore, userId]);

  // Handle marking notification as read
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      try {
        await client.mutate({
          mutation: MARK_NOTIFICATION_READ,
          variables: { notificationId: notification._id },
        });
        
        // Update local state
        setNotifications(prev =>
          prev.map(n =>
            n._id === notification._id ? { ...n, read: true } : n
          )
        );
      } catch (err) {
        console.error("Error marking notification as read:", err);
      }
    }
  };

  // Get notification link and text based on type
  const getNotificationContent = (notification: Notification) => {
    const actor = notification.actor;
    const entity = notification.entity;
    
    switch (notification.type) {
      case "like":
        return {
          link: entity.__typename === "Post" 
            ? `/${entity.author.preferred_username}/posts/${encodeId(entity._id)}`
            : '/',
          text: `${actor.name} liked your post`
        };
      case "comment":
        return {
          link: entity.__typename === "Post"
            ? `/${entity.author.preferred_username}/posts/${encodeId(entity._id)}`
            : '/',
          text: `${actor.name} commented on your post:`,
          preview: entity.__typename === "Post" ? entity.content : undefined
        };
      case "follow":
        return {
          link: `/${actor.preferred_username}`,
          text: `${actor.name} followed you`
        };
      case "vote":
        return {
          link: entity.__typename === "Post"
            ? `/${entity.author.preferred_username}/posts/${encodeId(entity._id)}`
            : '/',
          text: `${actor.name} voted on your poll`
        };
      case "mention":
        return {
          link: entity.__typename === "Post"
            ? `/${entity.author.preferred_username}/posts/${encodeId(entity._id)}`
            : '/',
          text: `${actor.name} mentioned you`
        };
      default:
        return { link: "/", text: "New notification" };
    }
  };

  if (error) {
    return <div>Error loading notifications</div>;
  }

  return (
    <ProtectedLayout currentPath={currentPath ?? "/notifications"}>
      <div className="flex justify-center max-w-3xl mx-auto h-[calc(100vh-4rem)]">
        <div className="flex-grow h-[calc(100vh-4rem)] mt-6">
          <LoadingAnimation isLoading={loading} />
          
          <div className="mb-6">
            <Tabs 
              defaultValue="all" 
              className="w-full"
              onValueChange={setActiveTab}
            >
              <TabsList className="grid w-full grid-cols-4 bg-white dark:bg-black border border-gray-200 dark:border-gray-800">
                <TabsTrigger 
                  value="all" 
                  className="text-gray-700 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-800 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white dark:text-gray-300"
                >
                  All
                </TabsTrigger>
                <TabsTrigger 
                  value="vote"
                  className="text-gray-700 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-800 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white dark:text-gray-300"
                >
                  Votes
                </TabsTrigger>
                <TabsTrigger 
                  value="mention"
                  className="text-gray-700 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-800 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white dark:text-gray-300"
                >
                  Mentions
                </TabsTrigger>
                <TabsTrigger 
                  value="comment"
                  className="text-gray-700 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-800 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white dark:text-gray-300"
                >
                  Comments
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="h-full" ref={scrollAreaRef}>
                <div className="max-w-3xl mx-auto mt-4">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => {
                      const { link, text, preview } = getNotificationContent(notification);
                      
                      return (
                        <Link 
                          href={link} 
                          key={notification._id.toString()} 
                          className="block mb-4"
                        >
                          <Alert
                            onClick={() => handleNotificationClick(notification)}
                            className={`cursor-pointer border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors ${
                              notification.read 
                                ? "bg-white dark:bg-black" 
                                : "bg-white dark:bg-black shadow-md dark:shadow-none"
                            }`}
                          >
                            <div className="flex items-center space-x-4">
                              <Image
                                src={notification.actor.profilePicture}
                                alt={notification.actor.name}
                                width={40}
                                height={40}
                                className="rounded-full"
                              />
                              <div className="flex-1">
                                <AlertTitle className="text-gray-900 dark:text-white">
                                  <span className="font-semibold">{text}</span>
                                  {notification.type === "comment" && preview && (
                                    <span className="font-normal ml-2 text-gray-600 dark:text-gray-400">
                                      {preview}
                                    </span>
                                  )}
                                </AlertTitle>
                                <AlertDescription className="text-gray-600 dark:text-gray-400">
                                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                </AlertDescription>
                              </div>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-purple-500 dark:bg-purple-400 rounded-full" />
                              )}
                            </div>
                          </Alert>
                        </Link>
                      );
                    })
                  ) : (
                    <p className="text-center text-gray-600 dark:text-gray-400">
                      No notifications
                    </p>
                  )}
                  
                  {hasMore && (
                    <div className="py-4 text-center text-gray-600 dark:text-gray-400">
                      Loading more...
                    </div>
                  )}
                </div>
              </ScrollArea>
            </Tabs>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}
