import React from 'react';
import Image from 'next/image';

const SuggestionPane: React.FC = () => {
  const suggestions = [
    { id: 1, name: 'John Doe', username: '@johndoe', avatar: '/default-avatar.png' },
    { id: 2, name: 'Jane Smith', username: '@janesmith', avatar: '/default-avatar.png' },
    { id: 3, name: 'Bob Johnson', username: '@bobjohnson', avatar: '/default-avatar.png' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-xl font-semibold mb-4">Suggestions for you</h2>
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
              <p className="font-semibold">{suggestion.name}</p>
              <p className="text-sm text-gray-500">{suggestion.username}</p>
            </div>
            <button className="ml-auto text-blue-500 hover:text-blue-600">Follow</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SuggestionPane;
