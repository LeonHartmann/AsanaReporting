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
      className={`fixed inset-0 bg-customGray-900 ${isFullscreen ? 'bg-opacity-80' : 'bg-opacity-60'} z-50 flex justify-center items-center ${isFullscreen ? 'p-0' : 'p-2 sm:p-4'} transition-opacity duration-300 ease-in-out font-sans`} // Updated overlay and font
      onClick={isFullscreen ? undefined : onClose} // Only close on backdrop click if not fullscreen
    >
      <div 
        ref={modalContentRef}
        className={`${isFullscreen ? 'w-screen h-screen rounded-none' : 'bg-white dark:bg-customGray-800 rounded-xl shadow-xl w-full max-w-7xl h-[90vh]'} relative flex flex-col transition-all duration-300 ease-in-out`} // Updated panel styles
        onClick={(e) => e.stopPropagation()}
      >
        {/* Control Buttons */}
        <div className={`absolute top-3 right-3 z-20 flex gap-2.5 ${isFullscreen ? 'opacity-30 hover:opacity-100 focus-within:opacity-100' : ''} transition-opacity`}> {/* Adjusted position and gap */}
          {/* Fullscreen Toggle Button */}
          <button 
            onClick={toggleFullscreen}
            className="text-customGray-600 dark:text-customGray-300 hover:text-customGray-900 dark:hover:text-white p-1.5 bg-white/70 dark:bg-customGray-700/70 hover:bg-customGray-100 dark:hover:bg-customGray-600 rounded-full w-9 h-9 flex items-center justify-center shadow-sm transition-colors" // Updated styles
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            title={isFullscreen ? "Exit fullscreen (Esc)" : "Enter fullscreen"}
          >
            {isFullscreen ? (
              // Minimize icon (Heroicons)
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5M15 15l5.25 5.25" />
              </svg>
            ) : (
              // Expand icon (Heroicons)
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9M20.25 20.25h-4.5m4.5 0v-4.5m0-4.5L15 15" />
              </svg>
            )}
          </button>
          
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="text-customGray-600 dark:text-customGray-300 hover:text-customGray-900 dark:hover:text-white p-1.5 bg-white/70 dark:bg-customGray-700/70 hover:bg-customGray-100 dark:hover:bg-customGray-600 rounded-full w-9 h-9 flex items-center justify-center shadow-sm transition-colors" // Updated styles
            aria-label="Close modal (Esc)"
            title="Close (Esc)"
          >
            {/* Close icon (Heroicons) */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Modal Title - only show when not in fullscreen */}
        {title && !isFullscreen && (
          <div className="px-6 pt-5 pb-3 border-b border-customGray-200 dark:border-customGray-700"> {/* Added border */}
            <h3 className="text-xl font-semibold text-customGray-900 dark:text-customGray-100 text-center"> {/* Updated text styles */}
              {title}
            </h3>
          </div>
        )}
        
        {/* Modal Content (Chart) */}
        <div className={`flex-1 ${isFullscreen ? 'p-0 bg-white dark:bg-customGray-800' : 'p-4 sm:p-6'} overflow-hidden`}> {/* Ensure bg for chart area in fullscreen */}
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