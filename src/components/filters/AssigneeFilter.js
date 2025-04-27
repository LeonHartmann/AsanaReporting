import React, { useState, useEffect } from 'react';

/**
 * AssigneeFilter component allows users to filter tasks by assignee
 * 
 * @param {Object} props
 * @param {Array} props.tasks - All tasks to extract assignees from
 * @param {string|null} props.selectedAssignee - Currently selected assignee
 * @param {Function} props.onAssigneeChange - Callback when assignee selection changes
 */
export default function AssigneeFilter({ tasks, selectedAssignee, onAssigneeChange }) {
  const [assignees, setAssignees] = useState([]);

  // Extract unique assignees from tasks when tasks change
  useEffect(() => {
    if (!tasks || tasks.length === 0) return;

    // Get unique assignees from tasks
    const uniqueAssignees = [...new Set(tasks.map(task => task.assignee || 'Unassigned'))];
    
    // Sort alphabetically
    uniqueAssignees.sort((a, b) => {
      if (a === 'Unassigned') return -1; // Always keep Unassigned at the top
      if (b === 'Unassigned') return 1;
      return a.localeCompare(b);
    });
    
    setAssignees(uniqueAssignees);
  }, [tasks]);

  const handleChange = (e) => {
    const value = e.target.value === 'all' ? null : e.target.value;
    onAssigneeChange(value);
  };

  return (
    <div className="mb-4">
      <label htmlFor="assignee-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Filter by Assignee
      </label>
      <select
        id="assignee-filter"
        className="block w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        value={selectedAssignee || 'all'}
        onChange={handleChange}
      >
        <option value="all">All Assignees</option>
        {assignees.map(assignee => (
          <option key={assignee} value={assignee}>
            {assignee}
          </option>
        ))}
      </select>
    </div>
  );
} 