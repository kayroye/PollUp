'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaTimes } from 'react-icons/fa';
import { ApolloClient, InMemoryCache, gql, useQuery } from '@apollo/client';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { useModal } from '@/contexts/ModalContext';
import Image from 'next/image';
import { SignIn, useUser } from '@clerk/nextjs';
import { encodeId } from '@/utils/idObfuscation';

const client = new ApolloClient({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || '/api/graphql',
  cache: new InMemoryCache(),
  credentials: 'include',
});

interface PollData {
  type: 'multiple' | 'single' | 'slider';
  question: string;
  options: string[];
  min?: number;
  max?: number;
}

const CREATE_POLL_MUTATION = gql`
mutation CreatePost(
  $content: String!
  $author: String!
  $createdAt: String!
  $type: PostType!
  $pollContent: JSON
  $mediaUrls: [String]
  $tags: [String]
  $visibility: Visibility
) {
  createPost(
    content: $content
    author: $author
    createdAt: $createdAt
    type: $type
    pollContent: $pollContent
    mediaUrls: $mediaUrls
    tags: $tags
    visibility: $visibility
  ) {
    _id
  }
}
`;

const GET_USER_PROFILE = gql`
query getUserById($userId: String!) {
  getUserById(_id: $userId) {
    _id
    preferred_username
    profilePicture
    name
    bio
    preferences
    followers
    following
    createdAt
    posts
  }
}
`;

const CreatePollModal: React.FC = () => {
  const { closeModal } = useModal();
  const router = useRouter();
  const [, setStep] = useState(1);
  const [pollData, setPollData] = useState<PollData>({
    type: 'single',
    question: '',
    options: ['', ''],
  });
  const { userId } = useAuth();
  const [error, setError] = useState<Error | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [content, setContent] = useState('');
  const [showPollOptions, setShowPollOptions] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');

  const { isSignedIn } = useUser();
  const { data: userData } = useQuery(GET_USER_PROFILE, { 
    variables: { userId },
    skip: !userId // Skip the query if userId is not available
  });

  useEffect(() => {
    if (!userId) {
      router.push('/sign-in');
    }
    // Trigger the animation after a short delay
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, [userId, router]);


  if (!userId) {
    return null; // This will prevent the component from rendering while redirecting
  }



  const handleTypeChange = (type: 'multiple' | 'single' | 'slider') => {
    setPollData({ ...pollData, type });
    setStep(2);
  };

  const handleQuestionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPollData({ ...pollData, question: e.target.value });
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...pollData.options];
    newOptions[index] = value;
    setPollData({ ...pollData, options: newOptions });
  };

  const addOption = () => {
    setPollData({ ...pollData, options: [...pollData.options, ''] });
  };

  const handleSubmit = async () => {
    setError(null);
    
    const variables = {
      content: content,
      author: userId,
      createdAt: new Date().toISOString(),
      type: 'poll' as const,
      pollContent: {
        question: pollData.question,
        type: pollData.type,
        options: pollData.options.filter(option => option !== ''),
        min: pollData?.min,
        max: pollData?.max,
      },
      mediaUrls: mediaUrls,
      tags: tags,
      visibility: visibility,
    };
    try {
      const { data } = await client.mutate({
        mutation: CREATE_POLL_MUTATION,
        variables: variables,
      });
      // Close the modal
      handleClose();
      // Take user to the post they just created
      router.push(`/${userData?.getUserById?.preferred_username}/posts/${encodeId(data.createPost._id)}`);
    } catch (err) {
      console.error('Error creating post:', err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
    }
  };

  const renderMainContent = () => (
    <div className="space-y-4">
      <div className="flex items-start space-x-3">
        <Image
          src={userData?.getUserById?.profilePicture || '/default_avatar.png'}
          alt="Profile"
          width={40}
          height={40}
          className="rounded-full"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Say something..."
          className="flex-grow p-2 border border-gray-200 dark:border-gray-800 rounded-lg resize-none h-20 bg-white dark:bg-black text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
        />
      </div>
      {!showPollOptions && (
        <button
          onClick={() => setShowPollOptions(true)}
          className="w-full p-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-full font-semibold transition-colors duration-200"
        >
          + Create Poll
        </button>
      )}
      {showPollOptions && (
        <div className="space-y-4">
          <div className="flex space-x-2">
            {['single', 'multiple', 'slider'].map((type) => (
              <button
                key={type}
                onClick={() => handleTypeChange(type as 'single' | 'multiple' | 'slider')}
                className={`flex-1 p-2 rounded-full transition-colors duration-200 ${
                  pollData.type === type 
                    ? 'bg-blue-500 dark:bg-blue-600 text-white' 
                    : 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={pollData.question}
            onChange={handleQuestionChange}
            placeholder="Enter your poll question"
            className="w-full p-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
          />
          {pollData.type === 'slider' ? (
            <div>
              <input
                type="number"
                value={pollData.min}
                onChange={(e) => setPollData({ ...pollData, min: parseInt(e.target.value) })}
                placeholder="Minimum value"
                className="w-full p-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white mb-2"
              />
              <input
                type="number"
                value={pollData.max}
                onChange={(e) => setPollData({ ...pollData, max: parseInt(e.target.value) })}
                placeholder="Maximum value"
                className="w-full p-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white mb-2"
              />
            </div>
          ) : (
            <div>
              {pollData.options.map((option, index) => (
                <input
                  key={index}
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className="w-full p-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white mb-2 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                />
              ))}
              <button
                onClick={addOption}
                className="w-full p-2 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-full font-semibold hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                + Add Option
              </button>
            </div>
          )}
        </div>
      )}
      <input
        type="text"
        placeholder="Add media URLs (comma separated)"
        onChange={(e) => setMediaUrls(e.target.value.split(',').map(url => url.trim()))}
        className="w-full p-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
      />
      <div className="space-y-2">
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as 'public' | 'private')}
          className="w-full p-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white"
        >
          <option value="public">Public</option>
          <option value="friends">Friends</option>
          <option value="private">Private</option>
        </select>
        <input
          type="text"
          placeholder="Add tags (comma separated)"
          onChange={(e) => setTags(e.target.value.split(',').map(tag => tag.trim()))}
          className="w-full p-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
        />
      </div>
    </div>
  );

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(closeModal, 300);
  };

  const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isSignedIn) {
    return <SignIn />;
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleOutsideClick}
    >
      <div 
        className={`
          bg-white dark:bg-black rounded-lg p-6 w-full max-w-md transform transition-all duration-300 ease-out
          border border-gray-200 dark:border-gray-800
          ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
        `}
      >
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Post</h1>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
            <FaTimes size={24} />
          </button>
        </div>
        {renderMainContent()}
        <button
          onClick={handleSubmit}
          className="w-full p-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-full font-semibold mt-4 transition-colors duration-200"
        >
          Post
        </button>
        {error && <p className="text-red-500 dark:text-red-400 mt-2">Error: {error.message}</p>}
      </div>
    </div>
  );
};

export default CreatePollModal;
