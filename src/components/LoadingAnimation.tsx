import React, { useEffect, useState } from 'react';

const LoadingAnimation: React.FC<{ isLoading: boolean }> = ({ isLoading }) => {
  const [activeBar, setActiveBar] = useState(-1);
  const totalBars = 3;

  useEffect(() => {
    const barInterval = setInterval(() => {
      setActiveBar((prev) => (prev + 1) % (totalBars + 1));
    }, 300);

    return () => clearInterval(barInterval);
  }, []);

  const getBarHeight = (index: number) => {
    const baseHeight = 16; // 1rem = 16px
    const maxHeights = [32, 48, 64]; // 2rem, 3rem, 4rem in pixels
    if (activeBar === -1) return maxHeights[index]; // Start with all bars at max height
    return index <= activeBar ? maxHeights[index] : baseHeight;
  };

  return (
    <div 
      className={`fixed inset-0 flex items-center justify-center bg-white dark:bg-black transition-opacity duration-500 ${
        isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      style={{ zIndex: 9999 }}
    >
      <div className="flex items-end space-x-3">
        {[...Array(totalBars)].map((_, index) => (
          <div
            key={index}
            style={{
              height: `${getBarHeight(index)}px`,
              transition: 'height 300ms ease-out',
            }}
            className="w-5 rounded-t-md bg-purple-700 dark:bg-purple-500"
          ></div>
        ))}
      </div>
    </div>
  );
};

export default LoadingAnimation;
