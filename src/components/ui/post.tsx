//import PollContent from '../PollContent';
import { useState, useCallback } from 'react';
import Image from 'next/image';
import { ObjectId } from 'mongodb';
import Link from 'next/link';
import { encodeId } from '@/utils/idObfuscation';
import { Heart, MessageCircle, Share, MoreVertical, Trash2, Flag } from 'lucide-react';
import { gql } from '@apollo/client';
import client from '@/lib/apolloClient';
import { useUser } from '@clerk/nextjs';
import { useAuth } from '@/contexts/ClerkAuthContext';

interface PollContentType {
    _id: string;
    question: string;
    options: string[];
    type: "multiple" | "single" | "slider";
    votes: Record<string, number>;
    createdAt: string;
    min?: number;
    max?: number;
}

interface PostProps {
    post: {
        _id: string;
        content: string;
        author: Author;
        createdAt: string;
        type: string;
        pollContent?: PollContentType;
        mediaUrls?: string[];
        likes: ObjectId[];
        comments: ObjectId[];
        tags: string[];
        visibility: string;
    };
}

interface Author {
    name: string;
    preferred_username: string;
    profilePicture: string;
}

const Post: React.FC<PostProps> = ({ post }) => {
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
    const [sliderValue, setSliderValue] = useState<number | null>(null);
    const { isLoaded, isSignedIn, user } = useUser();
    const { userId } = useAuth();
    const [, updateState] = useState({});
    const forceUpdate = useCallback(() => updateState({}), []);
    const [showMenu, setShowMenu] = useState(false);

    let likes = post.likes.length;

    const ADD_OR_REMOVE_LIKE = gql`
        mutation AddOrRemoveLike($targetId: String!, $userId: String!, $onWhat: LikeTarget!) {
            addOrRemoveLike(targetId: $targetId, userId: $userId, onWhat: $onWhat) {
                ... on Post {
                    _id
                    likes
                }
            }
        }
    `;

    const handleOptionChange = (option: string) => {
        if (post.pollContent && post.pollContent.type === 'single') {
            setSelectedOptions([option]);
        } else {
            setSelectedOptions(prev => 
                prev.includes(option) 
                    ? prev.filter(o => o !== option)
                    : [...prev, option]
            );
        }
    };

    const renderPollOptions = () => {
        if (post.pollContent?.type === 'slider') {
            return (
                <div className="mt-4">
                    <input
                        type="range"
                        id={`slider-${post._id}`}
                        min={post.pollContent.min || 0}
                        max={post.pollContent.max || 100}
                        value={sliderValue !== null ? sliderValue : (post.pollContent.min || 0)}
                        onChange={(e) => setSliderValue(Number(e.target.value))}
                        className="w-full"
                    />
                    <div className="flex justify-between mt-2">
                        <span>{post.pollContent.min || 0}</span>
                        <span>{sliderValue !== null ? sliderValue : 'Select a value'}</span>
                        <span>{post.pollContent.max || 100}</span>
                    </div>
                </div>
            );
        }

        return post.pollContent?.options.map((option, index) => (
            <div key={index} className="flex items-center mb-2">
                <input 
                    type={post.pollContent?.type === 'single' ? 'radio' : 'checkbox'}
                    id={`option-${post._id}-${index}`}
                    name={`poll-${post._id}`}
                    value={option}
                    checked={selectedOptions.includes(option)}
                    onChange={() => handleOptionChange(option)}
                    className="mr-2"
                />
                <label htmlFor={`option-${post._id}-${index}`} className="flex-grow">
                    {option}
                </label>
                <span className="text-gray-500">
                    {post.pollContent?.votes[option] || 0} votes
                </span>
            </div>
        ));
    };

    const isLiked = userId ? post.likes.some(id => id.toString() === userId) : false;

    const handleLike = async () => {
        if (!isLoaded || !isSignedIn) {
            return;
        }

        const variables = { targetId: post._id, userId: userId, onWhat: "post" };
        try {
            const { data } = await client.mutate({
                mutation: ADD_OR_REMOVE_LIKE,
                variables: variables
            });
            if (data && data.addOrRemoveLike) {
                likes = data.addOrRemoveLike.likes.length;
                forceUpdate();
            }
        } catch (error) {
            console.error('Error adding or removing like:', error);
        }
    };

    // New function to format the time difference
    const formatTimeDifference = (createdAt: string) => {
        const now = new Date();
        const created = new Date(createdAt);
        const diffInSeconds = Math.floor((now.getTime() - created.getTime()) / 1000);

        if (diffInSeconds < 60) return `${diffInSeconds}s`;
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
        if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 604800)}w`;
        return `${Math.floor(diffInSeconds / 31536000)}y`;
    };

    const toggleMenu = () => {
        setShowMenu(!showMenu);
    };

    return (
        <div className="bg-gray-100 shadow-md rounded-lg p-4 mb-4 w-full">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                    <Link href={`/${post.author.preferred_username}`}>
                        <div className="cursor-pointer">
                            <Image
                                src={post.author.profilePicture}
                                alt={`${post.author.name}'s profile`}
                                width={40}
                                height={40}
                                className="rounded-full mr-3"
                            />
                        </div>
                    </Link>
                    <div>
                        <Link href={`/${post.author.preferred_username}`}>
                            <h3 className="font-bold text-black hover:underline">{post.author.name}</h3>
                        </Link>
                        <span className="text-gray-700">@{post.author.preferred_username}</span>
                    </div>
                </div>
                <div className="flex items-center">
                    <span className="text-sm text-gray-700 mr-2">
                        {formatTimeDifference(post.createdAt)}
                    </span>
                    <div className="relative">
                        <button onClick={toggleMenu} className="text-gray-500 hover:text-gray-700">
                            <MoreVertical className="w-5 h-5" />
                        </button>
                        {showMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                                <div className="py-1">
                                    {user?.username === post.author.preferred_username && (
                                        <button className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left">
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete
                                        </button>
                                    )}
                                    <button className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                                        <Flag className="w-4 h-4 mr-2" />
                                        Report
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="mb-4 text-black">
                <p className="mb-2">{post.content}</p>
                {post.type === 'poll' && (
                    <>
                        <h4 className="font-bold mb-2">{post.pollContent?.question}</h4>
                        <div className="space-y-2">
                            {renderPollOptions()}
                        </div>
                    </>
                )}
            </div>
            <div className="flex justify-between items-center text-sm text-gray-700">
                <div className="flex space-x-4">
                    <button 
                        className={`flex items-center ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-blue-500'}`} 
                        onClick={handleLike}
                    >
                        <Heart 
                            className={`w-5 h-5 mr-1 transition-transform duration-300 ease-in-out ${
                                isLiked ? 'fill-current scale-125' : 'scale-100'
                            }`} 
                        />
                        <span>{likes}</span>
                    </button>
                    <Link href={`/${post.author.preferred_username}/posts/${encodeId(post._id)}`}>
                        <button className="flex items-center hover:text-blue-500">
                            <MessageCircle className="w-5 h-5 mr-1" />
                            <span>{post.comments.length}</span>
                        </button>
                    </Link>
                    <button className="flex items-center hover:text-blue-500">
                        <Share className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Post;
