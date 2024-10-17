import React from 'react';

interface PollContentType {
    id: string;
    question: string;
    type: 'multiple' | 'single' | 'slider';
    options?: string[]; // Used for multiple and single choice polls
    min?: number; // Used for slider polls
    max?: number; // Used for slider polls
    // Add other relevant fields as needed
}

interface PollContentProps {
    poll: PollContentType;
}



const PollContent: React.FC<PollContentProps> = ({ poll }) => {
    console.log(poll);

    const renderMultipleChoice = () => (
        <div className="poll multiple-choice">
            <h4>{poll.question}</h4>
            {poll.options && poll.options.map((option, index) => (
                <div key={index} className="option">
                    <input type="checkbox" id={`option-${index}`} name={`poll-${poll.id}`} />
                    <label htmlFor={`option-${index}`}>{option}</label>
                </div>
            ))}
        </div>
    );

    const renderSingleChoice = () => (
        <div className="poll single-choice">
            <h4>{poll.question}</h4>
            {poll.options && poll.options.map((option, index) => (
                <div key={index} className="option">
                    <input type="radio" id={`option-${index}`} name={`poll-${poll.id}`} />
                    <label htmlFor={`option-${index}`}>{option}</label>
                </div>
            ))}
        </div>
    );

    const renderSlider = () => (
        <div className="poll slider">
            <h4>{poll.question}</h4>
            <p className="debug-info">Debug: Rendering slider</p>
            <input
                type="range"
                min={poll.min !== undefined ? poll.min : 0}
                max={poll.max !== undefined ? poll.max : 100}
                defaultValue={(poll.min !== undefined ? poll.min : 0) + ((poll.max !== undefined ? poll.max : 100) - (poll.min !== undefined ? poll.min : 0)) / 2}
                className="slider-input w-full"
            />
            <div className="slider-values flex justify-between mt-2">
                <span>{poll.min !== undefined ? poll.min : 0}</span>
                <span>{poll.max !== undefined ? poll.max : 100}</span>
            </div>
        </div>
    );

    const renderPoll = () => {
        switch (poll.type) {
            case 'multiple':
                return renderMultipleChoice();
            case 'single':
                return renderSingleChoice();
            case 'slider':
                return renderSlider();
            default:
                return <div>Unsupported poll type.</div>;
        }
    };

    return (
        <div className="poll-content">
            {renderPoll()}
        </div>
    );
};

export default PollContent;
