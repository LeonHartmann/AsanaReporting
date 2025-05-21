import React, { useState, useEffect } from 'react';

function PdfExportSettingsModal({ isOpen, onClose, availableElements, selectedElementIds, onSave }) {
  const [currentSelection, setCurrentSelection] = useState(new Set(selectedElementIds));

  // Update internal state if the initial selection changes from outside
  useEffect(() => {
    setCurrentSelection(new Set(selectedElementIds));
  }, [selectedElementIds]);

  // Prevent rendering if not open
  if (!isOpen) return null;

  const handleCheckboxChange = (event) => {
    const { value, checked } = event.target;
    const newSelection = new Set(currentSelection);
    if (checked) {
      newSelection.add(value);
    } else {
      newSelection.delete(value);
    }
    setCurrentSelection(newSelection);
  };

  const handleSave = () => {
    onSave(Array.from(currentSelection)); // Pass the updated array of IDs back
  };

  const handleSelectAll = () => {
      setCurrentSelection(new Set(availableElements.map(el => el.id)));
  };

  const handleDeselectAll = () => {
      setCurrentSelection(new Set());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-customGray-900 bg-opacity-75 transition-opacity duration-300 ease-in-out font-sans"> {/* Updated overlay */}
      <div className="bg-white dark:bg-customGray-800 rounded-xl shadow-xl p-6 w-full max-w-lg transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-fade-in-scale"> {/* Updated panel, max-w-lg */}
        <h3 className="text-xl font-semibold mb-5 text-customGray-900 dark:text-customGray-100">Configure PDF Export Elements</h3> {/* Updated text styles */}

        <div className="mb-5 space-x-3"> {/* Updated spacing */}
          <button 
            onClick={handleSelectAll} 
            className="px-3.5 py-1.5 text-sm font-medium rounded-md text-customGray-700 dark:text-customGray-200 bg-customGray-100 dark:bg-customGray-700 hover:bg-customGray-200 dark:hover:bg-customGray-600 transition-colors"
          >
            Select All
          </button>
          <button 
            onClick={handleDeselectAll} 
            className="px-3.5 py-1.5 text-sm font-medium rounded-md text-customGray-700 dark:text-customGray-200 bg-customGray-100 dark:bg-customGray-700 hover:bg-customGray-200 dark:hover:bg-customGray-600 transition-colors"
          >
            Deselect All
          </button>
        </div>

        <div className="max-h-72 overflow-y-auto mb-6 pr-2 space-y-2.5"> {/* Increased max-h, updated spacing */}
          {availableElements.map((element) => (
            <div key={element.id} className="flex items-center p-1 hover:bg-customGray-50 dark:hover:bg-customGray-700/50 rounded-md"> {/* Added hover and rounded */}
              <input
                type="checkbox"
                id={`pdf-setting-${element.id}`}
                value={element.id}
                checked={currentSelection.has(element.id)}
                onChange={handleCheckboxChange}
                className="mr-2.5 h-4 w-4 rounded border-customGray-300 dark:border-customGray-500 text-primary focus:ring-2 focus:ring-primary/50 dark:bg-customGray-700 dark:ring-offset-customGray-800" // Updated checkbox style
              />
              <label htmlFor={`pdf-setting-${element.id}`} className="text-sm text-customGray-700 dark:text-customGray-300 select-none"> {/* Added select-none */}
                {element.name}
              </label>
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-md text-customGray-700 dark:text-customGray-200 bg-customGray-100 dark:bg-customGray-700 hover:bg-customGray-200 dark:hover:bg-customGray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light transition-colors" // Updated cancel button
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light disabled:opacity-60 transition-colors" // Updated save button
            disabled={currentSelection.size === 0}
          >
            Save Selection
          </button>
        </div>
      </div>
      {/* Add simple fade-in animation */}
      <style jsx>{`
        @keyframes fade-in-scale {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-fade-in-scale {
          animation: fade-in-scale 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default PdfExportSettingsModal; 