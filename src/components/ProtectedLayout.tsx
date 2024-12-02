"use client";
import { useEffect, ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useAuth } from "@/contexts/ClerkAuthContext";
import LoadingAnimation from "./LoadingAnimation";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { useSidebar } from "@/hooks/useSidebar";

interface ProtectedLayoutProps {
  children: ReactNode;
  currentPath: string;
}

export function ProtectedLayout({ children, currentPath }: ProtectedLayoutProps) {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const { userId, isLoading } = useAuth();
  const { isMobile, setIsMobile } = useSidebar();
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [showSidebarText, setShowSidebarText] = useState(false);

  useEffect(() => {
    setIsSidebarVisible(window.innerWidth > 768);
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
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setIsMobile]);

  useEffect(() => {
    if (isLoaded && !isSignedIn && !isLoading) {
      router.replace("/sign-in");
    }
  }, [isLoaded, isSignedIn, isLoading, router]);

  const mainContentStyle: React.CSSProperties = {
    marginLeft: isSidebarVisible ? (showSidebarText ? "16rem" : "5rem") : "0",
    paddingLeft: "2rem",
    width: isSidebarVisible
      ? showSidebarText
        ? "calc(100% - 16rem)"
        : "calc(100% - 5rem)"
      : "100%",
    maxWidth: "100%",
    overflowX: "hidden",
  };

  if (!isLoaded || isLoading || !userId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-black">
        <LoadingAnimation isLoading={true} />
      </div>
    );
  }

  return (
    <>
      <LoadingAnimation isLoading={false} />
      <div className="flex flex-col min-h-screen bg-white dark:bg-black">
        <Sidebar />
        <Navbar currentPath={currentPath} />
        <main
          className={`flex-grow w-full sm:px-6 lg:px-8 bg-white dark:bg-black ${
            isMobile ? "pt-14" : "py-8"
          }`}
          style={mainContentStyle}
        >
          {children}
        </main>
      </div>
    </>
  );
}