'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaTimes } from 'react-icons/fa';
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';
import { useAuth } from '@/contexts/AuthContext';
import LoadingAnimation from '@/components/LoadingAnimation';

// Initialize Apollo Client
const client = new ApolloClient({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || '/api/graphql',
  cache: new InMemoryCache(),
  credentials: 'include', // Include cookies in requests
});

interface PollData {
  type: 'multiple' | 'single' | 'slider';
  question: string;
  options: string[];
  min?: number;
  max?: number;
}

const CreatePoll: React.FC = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [pollData, setPollData] = useState<PollData>({
    type: 'single',
    question: '',
    options: ['', ''],
  });
  const [title, setTitle] = useState('');
  
  // Assuming you have a way to get the current user's ID
  const { user, loading } = useAuth();
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return <LoadingAnimation />;
  }

  if (!user) {
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
    console.log('Loading: ', true);
    setError(null);
    try {
      await client.mutate({
        mutation: gql`
          mutation createPost(
            $content: String!
            $author: String!
            $createdAt: String!
            $type: PostType!
            $pollContent: PollContentInput!
          ) {
            createPost(
              content: $content
              author: $author
              createdAt: $createdAt
              type: $type
              pollContent: $pollContent
            ) {
              _id
            }
          }
        `,
        variables: {
          content: title,
          author: user?._id,
          createdAt: new Date().toISOString(),
          type: 'poll',
          pollContent: {
            question: pollData.question,
            type: pollData.type,
            options: pollData.options.filter(option => option !== ''),
            min: pollData.min,
            max: pollData.max,
          },
        },
      });
      router.push('/');
    } catch (err) {
      console.error('Error creating post:', err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
    } finally {
      console.log('Loading: ', false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Choose Poll Type</h2>
      <button onClick={() => handleTypeChange('single')} className="w-full p-2 bg-blue-500 text-black rounded">Single Choice</button>
      <button onClick={() => handleTypeChange('multiple')} className="w-full p-2 bg-blue-500 text-black rounded">Multiple Choice</button>
      <button onClick={() => handleTypeChange('slider')} className="w-full p-2 bg-blue-500 text-black rounded">Slider</button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Enter Poll Question</h2>
      <input
        type="text"
        value={pollData.question}
        onChange={handleQuestionChange}
        placeholder="Enter your question"
        className="w-full p-2 border rounded"
      />
      <button onClick={() => setStep(3)} className="w-full p-2 bg-blue-500 text-black rounded">Next</button>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Enter Poll Options</h2>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Enter post title"
        className="w-full p-2 border rounded"
      />
      {pollData.type === 'slider' ? (
        <>
          <input
            type="number"
            value={pollData.min || ''}
            onChange={(e) => setPollData({ ...pollData, min: parseInt(e.target.value) })}
            placeholder="Minimum value"
            className="w-full p-2 border rounded"
          />
          <input
            type="number"
            value={pollData.max || ''}
            onChange={(e) => setPollData({ ...pollData, max: parseInt(e.target.value) })}
            placeholder="Maximum value"
            className="w-full p-2 border rounded"
          />
        </>
      ) : (
        <>
          {pollData.options.map((option, index) => (
            <input
              key={index}
              type="text"
              value={option}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              placeholder={`Option ${index + 1}`}
              className="w-full p-2 border rounded"
            />
          ))}
          <button onClick={addOption} className="w-full p-2 bg-green-500 text-black rounded">Add Option</button>
        </>
      )}
      <button onClick={handleSubmit} className="w-full p-2 bg-blue-500 text-black rounded">
        {loading ? 'Creating...' : 'Create Poll'}
      </button>
      {error && <p className="text-red-500">Error: {error.message}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Create a New Poll</h1>
          <button onClick={() => router.push('/')} className="text-gray-500 hover:text-gray-700">
            <FaTimes size={24} />
          </button>
        </div>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>
    </div>
  );
};

export default CreatePoll;
