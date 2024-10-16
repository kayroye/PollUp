//import PollContent from '../PollContent';
import { useState } from 'react';
import Image from 'next/image';

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
        author: {
            _id: string;
            preferred_username: string;
            profilePicture: string;
            name: string;
        };
        createdAt: string;
        type: string;
        pollContent?: PollContentType;
        likes: string[];
        comments: string[];
        tags: string[];
        visibility: string;
    };
}

const Post: React.FC<PostProps> = ({ post }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
    };

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
        return post.pollContent?.options.map((option, index) => (
            <div key={index} className="flex items-center mb-2">
                <input 
                    type={post.pollContent?.type === 'single' ? 'radio' : 'checkbox'}
                    id={`option-${index}`}
                    name="poll-option"
                    value={option}
                    checked={selectedOptions.includes(option)}
                    onChange={() => handleOptionChange(option)}
                    className="mr-2"
                />
                <label htmlFor={`option-${index}`} className="flex-grow">
                    {option}
                </label>
                <span className="text-gray-500">
                    {post.pollContent?.votes[option] || 0} votes
                </span>
            </div>
        ));
    };

    return (
        <div className="bg-gray-100 shadow-md rounded-lg p-4 mb-4 w-full">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                    <Image
                        src={post.author.profilePicture}
                        alt={`${post.author.name}'s profile`}
                        width={40}
                        height={40}
                        className="rounded-full mr-3"
                    />
                    <div>
                        <h3 className="font-bold text-black">{post.author.name}</h3>
                        <span className="text-gray-700">@{post.author.preferred_username}</span>
                    </div>
                </div>
                <div className="flex items-center">
                    <span className="text-sm text-gray-700 mr-2">{new Date(post.createdAt).toLocaleDateString()}</span>
                    <button onClick={handleEditToggle} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
                        Edit
                    </button>
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
                <span>{post.likes.length} Likes</span>
                <div className="flex space-x-4">
                    <button className="hover:text-blue-500">Like</button>
                    <button className="hover:text-blue-500">Comment {post.comments.length}</button>
                    <button className="hover:text-blue-500">Share</button>
                </div>
            </div>
        </div>
    );
};

export default Post;
