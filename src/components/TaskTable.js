import React, { useState, useMemo } from 'react';

// Define the statuses we want to show as columns
const statusColumns = [
  '📃 To Do',
  '☕️ Awaiting Info',
  '🎨 In progress',
  '📩 In Review',
  '🌀 Completed/Feedback'
];

// We'll use the above status names from our code for display, but the actual data might have variations

export default function TaskTable({ tasks, isLoading, error, onRowClick }) {
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'descending' });

  const sortedTasks = useMemo(() => {
    let sortableItems = [...tasks];
    const now = new Date(); // Get current time once for consistency in this sort run

    // Debug: Log the first task to see what status data is available
    if (sortableItems.length > 0) {
      console.log('First task data:', sortableItems[0]);
      // Show all available status duration keys
      const statusKeys = Object.keys(sortableItems[0]).filter(key => 
        key.includes('To Do') || 
        key.includes('Awaiting Info') || 
        key.includes('In progress') || 
        key.includes('In Review') || 
        key.includes('Completed/Feedback')
      );
      console.log('Available status duration keys:', statusKeys);
    }

    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        // Ensure values exist for sorting, default to empty string or 0 if null/undefined
        const aValue = a[sortConfig.key]; // Get raw value for potential date/duration calculation
        const bValue = b[sortConfig.key];

        // Handle status duration sorting
        if (statusColumns.includes(sortConfig.key)) {
          const durationA = a[sortConfig.key] !== 'N/A' ? parseFloat(a[sortConfig.key]) || 0 : 0;
          const durationB = b[sortConfig.key] !== 'N/A' ? parseFloat(b[sortConfig.key]) || 0 : 0;

          if (durationA < durationB) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (durationA > durationB) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
          return 0;
        }

        // Special handling for Open Duration sorting
        if (sortConfig.key === 'openDuration') {
          const getDurationMillis = (task) => {
            if (!task.createdAt) return 0; // No creation date, treat as 0 duration
            const creationDate = new Date(task.createdAt);
            let comparisonDate;
            if (task.completed && task.completedAt) {
              comparisonDate = new Date(task.completedAt);
            } else if (!task.completed) {
              comparisonDate = now; // Use 'now' for open tasks
            } else {
              return 0; // Completed but no completedAt date, treat as 0 duration for sorting
            }
            // Handle potential invalid dates or future creation dates
            if (isNaN(creationDate.getTime()) || isNaN(comparisonDate.getTime()) || creationDate > comparisonDate) {
              return 0; 
            }
            return comparisonDate.getTime() - creationDate.getTime(); // Duration in milliseconds
          };

          const durationA = getDurationMillis(a);
          const durationB = getDurationMillis(b);

          if (durationA < durationB) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (durationA > durationB) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
          return 0;
        }

        // Handle date sorting specifically for 'deadline' and 'createdAt'
        if (sortConfig.key === 'deadline' || sortConfig.key === 'createdAt') {
            // Use epoch if null, handle potentially invalid dates gracefully
            const dateA = aValue ? new Date(aValue).getTime() : (sortConfig.direction === 'ascending' ? Infinity : -Infinity);
            const dateB = bValue ? new Date(bValue).getTime() : (sortConfig.direction === 'ascending' ? Infinity : -Infinity);

             if (dateA < dateB) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
             }
             if (dateA > dateB) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
             }
             return 0;
        }
        
        // Default values for comparison if keys don't exist
        const valA = aValue ?? (typeof aValue === 'number' ? 0 : '');
        const valB = bValue ?? (typeof bValue === 'number' ? 0 : '');

        // Handle string sorting (case-insensitive)
        if (typeof valA === 'string' && typeof valB === 'string') {
          const comparison = valA.toLowerCase().localeCompare(valB.toLowerCase());
          return sortConfig.direction === 'ascending' ? comparison : -comparison;
        }
        
        // Handle numeric sorting or fallback comparison
        if (valA < valB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (valA > valB) {
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

  // Format duration in seconds to human-readable format
  const formatSeconds = (seconds) => {
    if (seconds === 'N/A') return 'N/A';
    if (seconds < 0) return 'N/A';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.round(seconds % 60);

    let result = '';
    if (days > 0) result += `${days}d `;
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0) result += `${minutes}m `;
    if (remainingSeconds > 0 && days === 0 && hours === 0 && minutes === 0) result += `${remainingSeconds}s`;
    else if (result === '') result = '0s';

    return result.trim();
  };

  // Renamed to calculateDuration as it now handles both open and completed tasks
  const calculateDuration = (createdAt, completedAt, completed) => {
    if (!createdAt) return 'N/A'; // Need a creation date
    try {
      const startDate = new Date(createdAt);
      let endDate;

      if (completed && completedAt) {
        endDate = new Date(completedAt);
      } else if (!completed) {
        endDate = new Date(); // Use 'now' for open tasks
      } else {
        // Completed but no completedAt date - cannot calculate
        return 'N/A'; 
      }

      // Ensure startDate is not in the future relative to endDate
      if (startDate > endDate) return 'Upcoming/Error'; 
      
      const diffTime = Math.abs(endDate - startDate);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
          const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
          if (diffHours === 0) {
              const diffMinutes = Math.floor(diffTime / (1000 * 60));
              return `${diffMinutes} min`;
          }
          return `${diffHours} hours`;
      }
      return `${diffDays} days`;
    } catch (e) {
      console.error("Error calculating duration:", e);
      return 'Error';
    }
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
              {/* Add status duration columns */}
              {statusColumns.map(status => (
                <th key={status} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort(status)}>
                  Time in {status} {sortConfig.key === status ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                </th>
              ))}
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('openDuration')}>
                Open Duration {sortConfig.key === 'openDuration' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
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
                <td colSpan={10 + statusColumns.length} className="text-center py-10">
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
                <td colSpan={10 + statusColumns.length} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-center">
                  No tasks found matching your criteria.
                </td>
              </tr>
            )}
            {!isLoading && sortedTasks.map((task) => (
              <tr 
                key={task.id} 
                className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick ? onRowClick(task) : undefined}
              >
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
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {task.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {formatStatus(task.completed, task.status)}
                </td>
                {/* Status duration cells */}
                {statusColumns.map(status => (
                  <td key={status} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatSeconds(task[status] || 'N/A')}
                  </td>
                ))}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {calculateDuration(task.createdAt, task.completedAt, task.completed)}
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