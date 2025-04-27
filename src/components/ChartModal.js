import React from 'react';

export default function ChartModal({ isOpen, onClose, title, children }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center p-4"
      onClick={onClose} // Close modal if overlay is clicked
    >
      <div 
        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl relative w-full max-w-6xl h-auto max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal content
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-2xl font-bold p-1 leading-none"
          aria-label="Close modal"
        >
          &times;
        </button>
        
        {/* Modal Title */}
        {title && (
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white text-center">
            {title}
          </h3>
        )}
        
        {/* Modal Content (Chart) - Let chart determine height within width */}
        <div className="w-full min-h-[300px] flex justify-center"> {/* Removed fixed height, added min-height and centering */}
           {/* The chart component passed as children should have responsive:true and maintainAspectRatio:false */} 
           {children}
        </div>
      </div>
    </div>
  );
} 