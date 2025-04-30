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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-fade-in-scale">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Configure PDF Export Elements</h3>

        <div className="mb-4 space-x-2">
          <button onClick={handleSelectAll} className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500">Select All</button>
          <button onClick={handleDeselectAll} className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500">Deselect All</button>
        </div>

        <div className="max-h-60 overflow-y-auto mb-6 pr-2 space-y-2"> {/* Scrollable area */}
          {availableElements.map((element) => (
            <div key={element.id} className="flex items-center">
              <input
                type="checkbox"
                id={`pdf-setting-${element.id}`}
                value={element.id}
                checked={currentSelection.has(element.id)}
                onChange={handleCheckboxChange}
                className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-blue-600 dark:ring-offset-gray-800"
              />
              <label htmlFor={`pdf-setting-${element.id}`} className="text-sm text-gray-700 dark:text-gray-300">
                {element.name}
              </label>
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose} // Simple close, doesn't save changes
            className="px-4 py-2 text-sm rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            disabled={currentSelection.size === 0} // Disable save if nothing selected
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