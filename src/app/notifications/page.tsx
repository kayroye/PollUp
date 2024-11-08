"use client";
import React, { useRef } from "react";
import { usePathname } from "next/navigation";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Notifications() {
  const currentPath = usePathname();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Placeholder notification data
  const mockNotifications = Array(5).fill({
    id: 1,
    type: "like",
    content: "Someone liked your poll",
    timestamp: "2 hours ago",
    read: false,
  });

  return (
    <ProtectedLayout currentPath={currentPath ?? "/notifications"}>
      <div className="flex justify-center max-w-3xl mx-auto h-full">
        <div className="flex-grow h-[calc(100vh-4rem)]">
          <div className="mb-6">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-white dark:bg-black border border-gray-200 dark:border-gray-800">
                <TabsTrigger 
                  value="all" 
                  className="data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-800 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white"
                >
                  All
                </TabsTrigger>
                <TabsTrigger 
                  value="mentions"
                  className="data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-800 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white"
                >
                  Mentions
                </TabsTrigger>
                <TabsTrigger 
                  value="likes"
                  className="data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-800 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white"
                >
                  Likes
                </TabsTrigger>
                <TabsTrigger 
                  value="comments"
                  className="data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-800 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white"
                >
                  Comments
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <ScrollArea className="h-full dark:bg-black" ref={scrollAreaRef}>
            <div className="space-y-2 pr-4">
              {mockNotifications.map((notification, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border border-gray-200 dark:border-gray-800 ${
                    notification.read 
                      ? "bg-gray-50 dark:bg-gray-900" 
                      : "bg-white dark:bg-black"
                  } hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors duration-200 cursor-pointer`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 dark:text-white">
                        {notification.content}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {notification.timestamp}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </ProtectedLayout>
  );
}
