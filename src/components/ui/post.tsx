//import PollContent from '../PollContent';
import { useState } from 'react';
import Image from 'next/image';

interface PollContentType {
    id: string;
    question: string;
    options: string[];
    type: "multiple" | "single" | "slider";
    // Add other relevant fields
}

interface PostProps {
    profilePicture: string;
    name: string;
    username: string;
    timestamp: Date;
    pollContent: PollContentType;
    votes: number;
    comments: number;
    reposts: number;
}

const Post: React.FC<PostProps> = ({
    profilePicture,
    name,
    username,
    timestamp,
    pollContent,
    votes,
    comments,
    reposts,
}) => {
    // State hooks for editable fields
    const [isEditing, setIsEditing] = useState(false);
    const [editedName] = useState(name);
    const [editedUsername ] = useState(username);
    const [editedProfilePicture] = useState(profilePicture);

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
    };

    return (
        <div className="bg-gray-100 shadow-md rounded-lg p-4 mb-4 w-full">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                    <Image
                        src={editedProfilePicture}
                        alt={`${name}'s profile`}
                        width={40}
                        height={40}
                        className="rounded-full mr-3"
                    />
                    <div>
                        <h3 className="font-bold text-black">{editedName}</h3>
                        <span className="text-gray-700">@{editedUsername}</span>
                    </div>
                </div>
                <div className="flex items-center">
                    <span className="text-sm text-gray-700 mr-2">{new Date(timestamp).toLocaleDateString()}</span>
                    <button onClick={handleEditToggle} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
                        Edit
                    </button>
                </div>
            </div>
            <div className="mb-4 text-black">
                <h4 className="font-bold mb-2">{pollContent.question}</h4>
                <div className="space-y-2">
                    {pollContent.options.map((option, index) => (
                        <div key={index} className="flex items-center">
                            <input type="checkbox" id={`option-${index}`} className="mr-2" />
                            <label htmlFor={`option-${index}`}>{option}</label>
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-700">
                <span>{votes} Votes</span>
                <div className="flex space-x-4">
                    <button className="hover:text-blue-500">Repost {reposts}</button>
                    <button className="hover:text-blue-500">Comment {comments}</button>
                    <button className="hover:text-blue-500">Share</button>
                </div>
            </div>
        </div>
    );
};

export default Post;
