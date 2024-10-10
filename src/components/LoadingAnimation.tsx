import React, { useEffect, useState } from 'react';

const LoadingAnimation: React.FC = () => {
  const [activeBar, setActiveBar] = useState(0);
  const totalBars = 3;

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveBar((prev) => (prev + 1) % (totalBars + 1));
    }, 300);

    return () => clearInterval(interval);
  }, []);

  const getBarHeight = (index: number) => {
    const baseHeight = 16; // 1rem = 16px
    const maxHeights = [48, 64, 80]; // 3rem, 4rem, 5rem in pixels
    return index < activeBar ? maxHeights[index] : baseHeight;
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex items-end space-x-3">
        {[...Array(totalBars)].map((_, index) => (
          <div
            key={index}
            style={{
              height: `${getBarHeight(index)}px`,
              transition: 'height 300ms ease-out'
            }}
            className="w-5 bg-blue-500 rounded-t-md"
          ></div>
        ))}
      </div>
    </div>
  );
};

export default LoadingAnimation;
