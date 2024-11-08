"use client";
import { usePathname } from "next/navigation";
import {
  FaFire,
  FaVoteYea,
  FaGamepad,
  FaFilm,
  FaMicrochip,
  FaFlask,
  FaHamburger,
  FaGlobeAmericas,
} from "react-icons/fa";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import SuggestionPane from "@/components/SuggestionPane";
import { useSidebar } from "@/hooks/useSidebar";

export default function Explore() {
  const currentPath = usePathname();
  const { isMobile } = useSidebar();

  const categories = [
    {
      icon: FaFire,
      label: "Trending",
      color: "text-orange-500 dark:text-orange-400",
    },
    {
      icon: FaVoteYea,
      label: "Politics",
      color: "text-blue-500 dark:text-blue-400",
    },
    {
      icon: FaGamepad,
      label: "Gaming",
      color: "text-purple-500 dark:text-purple-400",
    },
    {
      icon: FaFilm,
      label: "Entertainment",
      color: "text-pink-500 dark:text-pink-400",
    },
    {
      icon: FaMicrochip,
      label: "Technology",
      color: "text-gray-500 dark:text-gray-400",
    },
    {
      icon: FaFlask,
      label: "Science",
      color: "text-green-500 dark:text-green-400",
    },
    {
      icon: FaHamburger,
      label: "Food",
      color: "text-yellow-500 dark:text-yellow-400",
    },
    {
      icon: FaGlobeAmericas,
      label: "Travel",
      color: "text-cyan-500 dark:text-cyan-400",
    },
  ];

  return (
    <ProtectedLayout currentPath={currentPath ?? "/"}>
      <div className="flex flex-col lg:flex-row justify-center lg:space-x-8 max-w-7xl mx-auto">
        <div className="flex-grow max-w-full lg:max-w-2xl">
          <div className="relative mb-8">
            <Input
              type="search"
              placeholder="Search topics..."
              className="w-full pl-10 bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
            {categories.map((category, index) => (
              <Card
                key={index}
                className="p-4 hover:shadow-md dark:hover:shadow-none hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center aspect-square bg-white dark:bg-black border-gray-200 dark:border-gray-800"
              >
                <category.icon className={`text-3xl mb-2 ${category.color}`} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {category.label}
                </span>
              </Card>
            ))}
          </div>

          <div className="space-y-6"></div>
        </div>

        {!isMobile && (
          <div className="hidden lg:block w-full lg:w-80 mt-6 lg:mt-0">
            <SuggestionPane />
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
