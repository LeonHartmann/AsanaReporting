import React, { useState, useMemo } from 'react';

export default function TaskTable({ tasks, isLoading, error }) {
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'descending' });

  const sortedTasks = useMemo(() => {
    let sortableItems = [...tasks];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        // Ensure values exist for sorting, default to empty string or 0 if null/undefined
        const aValue = a[sortConfig.key] ?? (typeof a[sortConfig.key] === 'number' ? 0 : '');
        const bValue = b[sortConfig.key] ?? (typeof b[sortConfig.key] === 'number' ? 0 : '');

        // Handle date sorting specifically for 'deadline' and 'createdAt'
        if (sortConfig.key === 'deadline' || sortConfig.key === 'createdAt') {
            const dateA = aValue ? new Date(aValue) : new Date(0); // Use epoch if null
            const dateB = bValue ? new Date(bValue) : new Date(0);
             if (dateA < dateB) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
             }
             if (dateA > dateB) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
             }
             return 0;
        }

        // Handle string sorting (case-insensitive)
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
          return sortConfig.direction === 'ascending' ? comparison : -comparison;
        }
        
        // Handle numeric sorting or fallback comparison
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [tasks, sortConfig]);


  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    } else if (sortConfig.key === key && sortConfig.direction === 'descending') {
       // Optional: Third click could reset sort or cycle back to ascending
       // For now, let's just toggle between asc/desc
       direction = 'ascending'; 
    }
    setSortConfig({ key, direction });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  // Format a completion status as a styled badge
  const formatStatus = (completed, status) => {
    if (completed) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
          Completed
        </span>
      );
    }
    
    // Color code based on status name
    let colorClass = 'bg-gray-100 text-gray-800'; // Default
    
    if (status.toLowerCase().includes('in progress')) {
      colorClass = 'bg-blue-100 text-blue-800';
    } else if (status.toLowerCase().includes('todo') || status.toLowerCase().includes('to do')) {
      colorClass = 'bg-yellow-100 text-yellow-800';
    } else if (status.toLowerCase().includes('review')) {
      colorClass = 'bg-purple-100 text-purple-800';
    } else if (status.toLowerCase().includes('block')) {
      colorClass = 'bg-red-100 text-red-800';
    }
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorClass}`}>
        {status}
      </span>
    );
  };

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
       <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('brand')}>
                Brand {sortConfig.key === 'brand' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('asset')}>
                Asset {sortConfig.key === 'asset' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('requester')}>
                Requested By {sortConfig.key === 'requester' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('assignee')}>
                Assignee {sortConfig.key === 'assignee' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('taskType')}>
                Task Type {sortConfig.key === 'taskType' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('name')}>
                Task Name {sortConfig.key === 'name' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('status')}>
                Status {sortConfig.key === 'status' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('deadline')}>
                Deadline {sortConfig.key === 'deadline' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('createdAt')}>
                Created At {sortConfig.key === 'createdAt' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 relative">
            {isLoading && (
              <tr>
                <td colSpan="9" className="text-center py-10">
                   <div className="flex justify-center items-center">
                      <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                </td>
              </tr>
            )}
            {!isLoading && sortedTasks.length === 0 && (
              <tr>
                <td colSpan="9" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-center">
                  No tasks found matching your criteria.
                </td>
              </tr>
            )}
            {!isLoading && sortedTasks.map((task) => (
              <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {task.brand}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {task.asset}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {task.requester}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {task.assignee}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {task.taskType}
                </td>
                <td className="px-6 py-4 whitespace-normal text-sm text-gray-900 dark:text-white">
                  {task.name} 
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {formatStatus(task.completed, task.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(task.deadline)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(task.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 