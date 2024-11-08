import React from 'react';
import Image from 'next/image';

const SuggestionPane: React.FC = () => {
  const suggestions = [
    { id: 1, name: 'John Doe', username: '@johndoe', avatar: '/default_avatar.png' },
    { id: 2, name: 'Jane Smith', username: '@janesmith', avatar: '/default_avatar.png' },
    { id: 3, name: 'Bob Johnson', username: '@bobjohnson', avatar: '/default_avatar.png' },
  ];

  return (
    <div className="bg-white dark:bg-black rounded-lg shadow-md dark:shadow-none border border-transparent dark:border-gray-800 p-4">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        Suggestions for you
      </h2>
      <ul className="space-y-4">
        {suggestions.map((suggestion) => (
          <li key={suggestion.id} className="flex items-center">
            <Image
              src={suggestion.avatar}
              alt={`${suggestion.name}'s avatar`}
              width={40}
              height={40}
              className="rounded-full mr-3"
            />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {suggestion.name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {suggestion.username}
              </p>
            </div>
            <button className="ml-auto text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300">
              Follow
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SuggestionPane;
