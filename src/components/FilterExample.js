import React, { useState, useEffect } from 'react';
import FilterBar from './filters/FilterBar';
import { filterTasks } from '../utils/filterTasks';

/**
 * Example component demonstrating how to implement the filter functionality
 * 
 * @param {Object} props
 * @param {Array} props.allTasks - All tasks from the API
 * @param {Function} props.renderDashboard - Function to render dashboard with filtered tasks
 */
export default function FilterExample({ allTasks, renderDashboard }) {
  // Initialize filter state
  const [filters, setFilters] = useState({
    assignee: null, // No assignee filter initially
  });
  
  // State for filtered tasks
  const [filteredTasks, setFilteredTasks] = useState([]);
  
  // Apply filters whenever tasks or filters change
  useEffect(() => {
    const filtered = filterTasks(allTasks, filters);
    setFilteredTasks(filtered);
  }, [allTasks, filters]);
  
  // Handler for filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };
  
  return (
    <div>
      {/* Filter Bar */}
      <FilterBar 
        tasks={allTasks} 
        filters={filters} 
        onFilterChange={handleFilterChange} 
      />
      
      {/* Display filter summary if any filters are active */}
      {filters.assignee && (
        <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
          <p className="text-sm">
            <span className="font-semibold">Active Filters:</span>{' '}
            Showing tasks assigned to {filters.assignee}
            {' '}
            <button 
              onClick={() => setFilters({...filters, assignee: null})}
              className="underline text-blue-600 dark:text-blue-300 ml-2"
            >
              Clear
            </button>
          </p>
        </div>
      )}
      
      {/* Show task count */}
      <div className="mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Showing {filteredTasks.length} of {allTasks.length} tasks
        </p>
      </div>
      
      {/* Render dashboard with filtered tasks */}
      {renderDashboard(filteredTasks)}
    </div>
  );
} 