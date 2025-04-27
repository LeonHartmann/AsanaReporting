import React, { useEffect, useRef } from 'react';

export default function ChartModal({ isOpen, onClose, title, children }) {
  const modalContentRef = useRef(null);

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
    }
    
    // Cleanup function
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-2 sm:p-4 transition-opacity duration-300 ease-in-out"
      onClick={onClose}
    >
      <div 
        ref={modalContentRef}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl relative w-full max-w-7xl h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-2xl font-bold p-1 leading-none z-10 bg-white dark:bg-gray-700 rounded-full w-8 h-8 flex items-center justify-center"
          aria-label="Close modal"
        >
          &times;
        </button>
        
        {/* Modal Title */}
        {title && (
          <div className="px-6 pt-6 pb-2">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white text-center">
              {title}
            </h3>
          </div>
        )}
        
        {/* Modal Content (Chart) */}
        <div className="flex-1 p-4 overflow-hidden">
          <div className="w-full h-full">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
} 