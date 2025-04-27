import React from 'react';
import AssigneeFilter from './AssigneeFilter';

/**
 * FilterBar component that houses all filters for the dashboard
 * 
 * @param {Object} props 
 * @param {Array} props.tasks - All tasks to be filtered
 * @param {Object} props.filters - Current filter state
 * @param {Function} props.onFilterChange - Callback when any filter changes
 */
export default function FilterBar({ tasks, filters, onFilterChange }) {
  // Handle assignee filter changes
  const handleAssigneeChange = (assignee) => {
    onFilterChange({
      ...filters,
      assignee
    });
  };

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow mb-4">
      <h2 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-200">Filters</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AssigneeFilter 
          tasks={tasks} 
          selectedAssignee={filters.assignee}
          onAssigneeChange={handleAssigneeChange}
        />
        {/* Additional filters can be added here */}
      </div>
    </div>
  );
} 