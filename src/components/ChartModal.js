import React, { useEffect, useRef, useState } from 'react';

export default function ChartModal({ isOpen, onClose, title, children }) {
  const modalContentRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Force Chart.js to recalculate size after modal animation completes
      const timer = setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
        // Force another resize after a brief delay to ensure charts render properly
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
        }, 200);
      }, 100);
      
      // Prevent body scrolling when modal is open
      document.body.style.overflow = 'hidden';
      
      return () => clearTimeout(timer);
    } else {
      // Re-enable body scrolling when modal is closed
      document.body.style.overflow = 'auto';
      // Reset fullscreen state when modal closes
      setIsFullscreen(false);
    }
    
    // Cleanup function
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Handle escape key to close modal or exit fullscreen
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else if (isOpen) {
          onClose();
        }
      }
    };
    
    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [isOpen, onClose, isFullscreen]);

  // Toggle fullscreen mode
  const toggleFullscreen = (e) => {
    e.stopPropagation();
    setIsFullscreen(!isFullscreen);
    // Force a resize event to make charts adjust to the new size
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className={`fixed inset-0 bg-black ${isFullscreen ? 'bg-opacity-90' : 'bg-opacity-75'} z-50 flex justify-center items-center ${isFullscreen ? 'p-0' : 'p-2 sm:p-4'} transition-all duration-300 ease-in-out`}
      onClick={isFullscreen ? toggleFullscreen : onClose}
    >
      <div 
        ref={modalContentRef}
        className={`${isFullscreen ? 'w-screen h-screen rounded-none' : 'bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-7xl h-[90vh]'} relative flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Control Buttons */}
        <div className={`absolute top-2 right-2 z-10 flex gap-2 ${isFullscreen ? 'opacity-50 hover:opacity-100' : ''} transition-opacity`}>
          {/* Fullscreen Toggle Button */}
          <button 
            onClick={toggleFullscreen}
            className={`text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white p-1 leading-none bg-white dark:bg-gray-700 rounded-full w-8 h-8 flex items-center justify-center`}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? (
              // Minimize icon
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M5.5 0a.5.5 0 0 1 .5.5v4A1.5 1.5 0 0 1 4.5 6h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5zm5 0a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 10 4.5v-4a.5.5 0 0 1 .5-.5zM0 10.5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 6 11.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5zm10 1a1.5 1.5 0 0 1 1.5-1.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4z"/>
              </svg>
            ) : (
              // Expand icon
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M1.5 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4A1.5 1.5 0 0 1 1.5 0h4a.5.5 0 0 1 0 1h-4zM10 .5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 16 1.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5zM.5 10a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 0 14.5v-4a.5.5 0 0 1 .5-.5zm15 0a.5.5 0 0 1 .5.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5z"/>
              </svg>
            )}
          </button>
          
          {/* Close Button */}
          <button 
            onClick={onClose}
            className={`text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-2xl font-bold p-1 leading-none bg-white dark:bg-gray-700 rounded-full w-8 h-8 flex items-center justify-center`}
            aria-label="Close modal"
            title="Close"
          >
            &times;
          </button>
        </div>
        
        {/* Modal Title - only show when not in fullscreen */}
        {title && !isFullscreen && (
          <div className="px-6 pt-6 pb-2">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white text-center">
              {title}
            </h3>
          </div>
        )}
        
        {/* Modal Content (Chart) */}
        <div className={`flex-1 ${isFullscreen ? 'p-0' : 'p-4'} overflow-hidden`}>
          <div className="w-full h-full">
            {/* Pass isFullscreen prop to child components */}
            {React.Children.map(children, child => 
              React.isValidElement(child) 
                ? React.cloneElement(child, { isFullscreen }) 
                : child
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 