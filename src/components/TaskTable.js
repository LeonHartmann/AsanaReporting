import React, { useState, useMemo } from 'react';

// Define the statuses we want to show as columns
// Use exact names from Supabase (including whitespace)
const statusColumns = [
  '📃 To Do ',
  ' ☕️ Awaiting Info',
  '🎨 In progress',
  '📩 In Review ',
  '🌀 Completed/Feedback'
];

// We'll use the above status names from our code for display, but the actual data might have variations

export default function TaskTable({ tasks, isLoading, error, onRowClick }) {
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'descending' });

  const sortedTasks = useMemo(() => {
    let sortableItems = [...tasks];
    const now = new Date(); // Get current time once for consistency in this sort run

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
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-GB', { // Using en-GB for dd/mm/yyyy
        day: '2-digit', month: '2-digit', year: 'numeric'
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  // Updated formatStatus function
  const formatStatus = (completed, status) => {
    let text = status;
    let bgColor = 'bg-customGray-200 dark:bg-customGray-600';
    let textColor = 'text-customGray-800 dark:text-customGray-100';

    if (completed) {
      text = 'Completed';
      bgColor = 'bg-success'; // Using success color from config
      textColor = 'text-white';
    } else {
      const lowerStatus = status ? status.toLowerCase() : '';
      if (lowerStatus.includes('in progress')) {
        bgColor = 'bg-primary'; // Using primary for In Progress (as info)
        textColor = 'text-white';
      } else if (lowerStatus.includes('todo') || lowerStatus.includes('to do')) {
        bgColor = 'bg-warning'; // Using warning
        textColor = 'text-customGray-900'; // Dark text for yellow bg
      } else if (lowerStatus.includes('review')) {
        bgColor = 'bg-accent-purple'; // Using accent.purple
        textColor = 'text-white';
      } else if (lowerStatus.includes('block')) {
        bgColor = 'bg-error'; // Using error
        textColor = 'text-white';
      } else if (lowerStatus.includes('awaiting info')) {
        bgColor = 'bg-accent-orange'; // Using accent.orange
        textColor = 'text-white';
      } else if (lowerStatus.includes('completed/feedback')) {
        bgColor = 'bg-secondary'; // Using secondary for feedback
        textColor = 'text-white';
        text = 'Feedback'; // Shorten display name
      }
    }
    
    return (
      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${bgColor} ${textColor} whitespace-nowrap`}>
        {text}
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
      <div className="bg-error/10 border border-error/40 text-error px-4 py-3 rounded-lg relative font-sans" role="alert"> {/* Updated error style */}
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }
  
  const headerCellClasses = "px-5 py-3.5 text-left text-xs font-semibold text-customGray-600 dark:text-customGray-300 uppercase tracking-wider cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary focus:bg-customGray-100 dark:focus:bg-customGray-600 transition-colors duration-150";
  const bodyCellClasses = "px-5 py-4 whitespace-nowrap text-sm";
  const textMainClasses = "text-customGray-900 dark:text-customGray-100";
  const textSubtleClasses = "text-customGray-500 dark:text-customGray-400";

  return (
    <div className="bg-white dark:bg-customGray-800 shadow-xl overflow-hidden rounded-xl font-sans"> {/* Updated container styles */}
       <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-customGray-200 dark:divide-customGray-700">
          <thead className="bg-customGray-50 dark:bg-customGray-700/50"> {/* Updated header bg */}
            <tr>
              <th scope="col" className={headerCellClasses} onClick={() => requestSort('brand')}>
                Brand <span className="opacity-70 ml-1">{sortConfig.key === 'brand' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '↕'}</span>
              </th>
              <th scope="col" className={headerCellClasses} onClick={() => requestSort('asset')}>
                Asset <span className="opacity-70 ml-1">{sortConfig.key === 'asset' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '↕'}</span>
              </th>
              <th scope="col" className={headerCellClasses} onClick={() => requestSort('requester')}>
                Requested By <span className="opacity-70 ml-1">{sortConfig.key === 'requester' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '↕'}</span>
              </th>
              <th scope="col" className={headerCellClasses} onClick={() => requestSort('assignee')}>
                Assignee <span className="opacity-70 ml-1">{sortConfig.key === 'assignee' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '↕'}</span>
              </th>
              <th scope="col" className={headerCellClasses} onClick={() => requestSort('taskType')}>
                Task Type <span className="opacity-70 ml-1">{sortConfig.key === 'taskType' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '↕'}</span>
              </th>
              <th scope="col" className={`${headerCellClasses} min-w-[200px]`} onClick={() => requestSort('name')}> {/* Added min-width */}
                Task Name <span className="opacity-70 ml-1">{sortConfig.key === 'name' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '↕'}</span>
              </th>
              <th scope="col" className={headerCellClasses} onClick={() => requestSort('status')}>
                Status <span className="opacity-70 ml-1">{sortConfig.key === 'status' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '↕'}</span>
              </th>
              {statusColumns.map(status => (
                <th key={status} scope="col" className={headerCellClasses} onClick={() => requestSort(status)}>
                  Time in {status.trim()} <span className="opacity-70 ml-1">{sortConfig.key === status ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '↕'}</span>
                </th>
              ))}
              <th scope="col" className={headerCellClasses} onClick={() => requestSort('openDuration')}>
                Open Duration <span className="opacity-70 ml-1">{sortConfig.key === 'openDuration' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '↕'}</span>
              </th>
              <th scope="col" className={headerCellClasses} onClick={() => requestSort('deadline')}>
                Deadline <span className="opacity-70 ml-1">{sortConfig.key === 'deadline' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '↕'}</span>
              </th>
              <th scope="col" className={headerCellClasses} onClick={() => requestSort('createdAt')}>
                Created At <span className="opacity-70 ml-1">{sortConfig.key === 'createdAt' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '↕'}</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-customGray-800 divide-y divide-customGray-200 dark:divide-customGray-700 relative">
            {isLoading && (
              <tr>
                <td colSpan={7 + statusColumns.length} className="text-center py-10"> {/* Adjusted colSpan */}
                   <div className="flex justify-center items-center">
                      <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> {/* Used primary color */}
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                </td>
              </tr>
            )}
            {!isLoading && sortedTasks.length === 0 && (
              <tr>
                <td colSpan={7 + statusColumns.length} className={`${bodyCellClasses} ${textSubtleClasses} text-center`}> {/* Adjusted colSpan */}
                  No tasks found matching your criteria.
                </td>
              </tr>
            )}
            {!isLoading && sortedTasks.map((task) => (
              <tr 
                key={task.id} 
                className={`hover:bg-customGray-50 dark:hover:bg-customGray-700/60 transition-colors duration-150 ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick ? onRowClick(task) : undefined}
              >
                <td className={`${bodyCellClasses} font-medium ${textMainClasses}`}>
                  {task.brand || 'N/A'}
                </td>
                <td className={`${bodyCellClasses} ${textSubtleClasses}`}>
                  {task.asset || 'N/A'}
                </td>
                <td className={`${bodyCellClasses} ${textSubtleClasses}`}>
                  {task.requester || 'N/A'}
                </td>
                <td className={`${bodyCellClasses} ${textSubtleClasses}`}>
                  {task.assignee || 'Unassigned'}
                </td>
                <td className={`${bodyCellClasses} ${textSubtleClasses}`}>
                  {task.taskType || 'N/A'}
                </td>
                <td className={`${bodyCellClasses} ${textMainClasses} max-w-xs truncate`}> {/* Added max-width and truncate */}
                  {task.name}
                </td>
                <td className={`${bodyCellClasses} ${textSubtleClasses}`}>
                  {formatStatus(task.completed, task.status)}
                </td>
                {statusColumns.map(status => (
                  <td key={status} className={`${bodyCellClasses} ${textSubtleClasses}`}>
                    {formatSeconds(task[status] || 'N/A')}
                  </td>
                ))}
                <td className={`${bodyCellClasses} ${textSubtleClasses}`}>
                  {calculateDuration(task.createdAt, task.completedAt, task.completed)}
                </td>
                <td className={`${bodyCellClasses} ${textSubtleClasses}`}>
                  {formatDate(task.deadline)}
                </td>
                <td className={`${bodyCellClasses} ${textSubtleClasses}`}>
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