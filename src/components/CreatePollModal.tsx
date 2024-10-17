'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaTimes } from 'react-icons/fa';
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';
import { useAuth } from '@/contexts/AuthContext';
import LoadingAnimation from '@/components/LoadingAnimation';
import { useModal } from '@/contexts/ModalContext';
import Image from 'next/image';

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

const CreatePollModal: React.FC = () => {
  const { closeModal } = useModal();
  const router = useRouter();
  const [, setStep] = useState(1);
  const [pollData, setPollData] = useState<PollData>({
    type: 'single',
    question: '',
    options: ['', ''],
  });
  const [title] = useState('');
  const { user, loading } = useAuth();
  const [error, setError] = useState<Error | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [content, setContent] = useState('');
  const [showPollOptions, setShowPollOptions] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    // Trigger the animation after a short delay
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, [user, loading, router]);

  if (loading) {
    return <LoadingAnimation />;
  }

  if (!user) {
    return null; // This will prevent the component from rendering while redirecting
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
    console.log('Loading: ', true);
    setError(null);
    const variables = {
      content: title,
      author: user?._id,
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
    console.log('Mutation variables:', JSON.stringify(variables, null, 2));
    try {
      const result = await client.mutate({
        mutation: CREATE_POLL_MUTATION,
        variables: variables,
      });
      console.log('Mutation result:', result);
      // Close the modal
      handleClose();
    } catch (err) {
      console.error('Error creating post:', err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
    } finally {
      console.log('Loading: ', false);
    }
  };

  console.log(user);

  const renderMainContent = () => (
    <div className="space-y-4">
      <div className="flex items-start space-x-3">
        <Image
          src={user?.profilePicture || '/default_avatar.png'}
          alt="Profile"
          width={40}
          height={40}
          className="rounded-full"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Say something..."
          className="flex-grow p-2 border rounded-lg resize-none h-20 text-black"
        />
      </div>
      {!showPollOptions && (
        <button
          onClick={() => setShowPollOptions(true)}
          className="w-full p-2 bg-blue-500 text-white rounded-full font-semibold"
        >
          + Create Poll
        </button>
      )}
      {showPollOptions && (
        <div className="space-y-4">
          {/* Poll type selection */}
          <div className="flex space-x-2">
            {['single', 'multiple', 'slider'].map((type) => (
              <button
                key={type}
                onClick={() => handleTypeChange(type as 'single' | 'multiple' | 'slider')}
                className={`flex-1 p-2 rounded-full ${pollData.type === type ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
          {/* Poll question input */}
          <input
            type="text"
            value={pollData.question}
            onChange={handleQuestionChange}
            placeholder="Enter your poll question"
            className="w-full p-2 border rounded-lg text-black"
          />
          {/* Poll options */}
          {pollData.type === 'slider' ? (
            <div>
              <input
                type="number"
                value={pollData.min}
                onChange={(e) => setPollData({ ...pollData, min: parseInt(e.target.value) })}
                placeholder="Minimum value"
                className="w-full p-2 border rounded-lg text-black mb-2"
              />
              <input
                type="number"
                value={pollData.max}
                onChange={(e) => setPollData({ ...pollData, max: parseInt(e.target.value) })}
                placeholder="Maximum value"
                className="w-full p-2 border rounded-lg text-black mb-2"
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
                  className="w-full p-2 border rounded-lg text-black mb-2"
                />
              ))}
              <button
                onClick={addOption}
                className="w-full p-2 bg-gray-200 text-black rounded-full font-semibold"
              >
                + Add Option
              </button>
            </div>
          )}
        </div>
      )}
      {/* Media URLs input */}
      <input
        type="text"
        placeholder="Add media URLs (comma separated)"
        onChange={(e) => setMediaUrls(e.target.value.split(',').map(url => url.trim()))}
        className="w-full p-2 border rounded-lg text-black"
      />

      {/* Visibility and tags */}
      <div className="space-y-2">
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as 'public' | 'private')}
          className="w-full p-2 border rounded-lg text-black"
        >
          <option value="public">Public</option>
          <option value="friends">Friends</option>
          <option value="private">Private</option>
        </select>
        <input
          type="text"
          placeholder="Add tags (comma separated)"
          onChange={(e) => setTags(e.target.value.split(',').map(tag => tag.trim()))}
          className="w-full p-2 border rounded-lg text-black"
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

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleOutsideClick}
    >
      <div 
        className={`
          bg-white rounded-lg p-6 w-full max-w-md transform transition-all duration-300 ease-out
          ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
        `}
      >
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-black">Create a New Poll</h1>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes size={24} />
          </button>
        </div>
        {renderMainContent()}
        <button
          onClick={handleSubmit}
          className="w-full p-2 bg-blue-500 text-white rounded-full font-semibold mt-4"
        >
          Post
        </button>
        {error && <p className="text-red-500 mt-2">Error: {error.message}</p>}
      </div>
    </div>
  );
};

export default CreatePollModal;
