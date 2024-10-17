import React, { useEffect, useState } from 'react';

const LoadingAnimation: React.FC<{ isLoading: boolean }> = ({ isLoading }) => {
  const [activeBar, setActiveBar] = useState(-1);
  const [isVisible, setIsVisible] = useState(true);
  const totalBars = 3;

  useEffect(() => {
    if (!isLoading) {
      // Start fade out when loading is complete
      const fadeOutTimeout = setTimeout(() => {
        setIsVisible(false);
      }, 500); // Delay fade out by 500ms to ensure minimum visibility time

      return () => clearTimeout(fadeOutTimeout);
    }
  }, [isLoading]);

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

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 flex items-center justify-center bg-white transition-opacity duration-300 ${
        isLoading ? 'opacity-100' : 'opacity-0'
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
              backgroundColor: '#501ca5'
            }}
            className="w-5 rounded-t-md"
          ></div>
        ))}
      </div>
    </div>
  );
};

export default LoadingAnimation;
