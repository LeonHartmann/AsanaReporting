import React, { useState, useMemo } from 'react';

// Core columns that are always visible
const CORE_COLUMNS = [
  { key: 'brand', label: 'Brand', width: 'w-80', searchable: true },
  { key: 'status', label: 'Status', width: 'w-32', searchable: false },
  { key: 'requester', label: 'Requested By', width: 'w-32', searchable: true },
  { key: 'assignee', label: 'Assignee', width: 'w-32', searchable: true },
  { key: 'deadline', label: 'Deadline', width: 'w-28', searchable: false },
  { key: 'openDuration', label: 'Duration', width: 'w-24', searchable: false }
];

// Define the statuses we want to show in detailed view
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
  const [selectedTask, setSelectedTask] = useState(null);
  
  // Search states for each searchable field
  const [searchTerms, setSearchTerms] = useState({
    brand: '',
    requester: '',
    assignee: ''
  });

  const handleRowClick = (task) => {
    if (onRowClick) {
      onRowClick(task);
    } else {
      setSelectedTask(task);
    }
  };

  const closeModal = () => {
    setSelectedTask(null);
  };

  // Update search term for a specific field
  const handleSearchChange = (field, value) => {
    setSearchTerms(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Clear all search terms
  const clearAllSearches = () => {
    setSearchTerms({
      brand: '',
      requester: '',
      assignee: ''
    });
  };

  const sortedTasks = useMemo(() => {
    let sortableItems = [...tasks];
    const now = new Date();

    // First, apply search filters
    sortableItems = sortableItems.filter(task => {
      const brandMatch = !searchTerms.brand || 
        (task.brand && task.brand.toLowerCase().includes(searchTerms.brand.toLowerCase()));
      
      const requesterMatch = !searchTerms.requester || 
        (task.requester && task.requester.toLowerCase().includes(searchTerms.requester.toLowerCase()));
      
      const assigneeMatch = !searchTerms.assignee || 
        (task.assignee && task.assignee.toLowerCase().includes(searchTerms.assignee.toLowerCase()));

      return brandMatch && requesterMatch && assigneeMatch;
    });

    // Then apply sorting
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
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
            if (!task.createdAt) return 0;
            const creationDate = new Date(task.createdAt);
            let comparisonDate;
            if (task.completed && task.completedAt) {
              comparisonDate = new Date(task.completedAt);
            } else if (!task.completed) {
              comparisonDate = now;
            } else {
              return 0;
            }
            if (isNaN(creationDate.getTime()) || isNaN(comparisonDate.getTime()) || creationDate > comparisonDate) {
              return 0; 
            }
            return comparisonDate.getTime() - creationDate.getTime();
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

        // Handle date sorting
        if (sortConfig.key === 'deadline' || sortConfig.key === 'createdAt') {
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
        
        const valA = aValue ?? (typeof aValue === 'number' ? 0 : '');
        const valB = bValue ?? (typeof bValue === 'number' ? 0 : '');

        if (typeof valA === 'string' && typeof valB === 'string') {
          const comparison = valA.toLowerCase().localeCompare(valB.toLowerCase());
          return sortConfig.direction === 'ascending' ? comparison : -comparison;
        }
        
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
  }, [tasks, sortConfig, searchTerms]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    } else if (sortConfig.key === key && sortConfig.direction === 'descending') {
       direction = 'ascending'; 
    }
    setSortConfig({ key, direction });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-GB', {
        day: '2-digit', 
        month: '2-digit', 
        year: '2-digit'
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const formatStatus = (completed, status) => {
    let text = status;
    let bgColor = 'bg-gray-100 dark:bg-gray-700';
    let textColor = 'text-gray-700 dark:text-gray-300';

    if (completed) {
      text = 'Completed';
      bgColor = 'bg-emerald-100 dark:bg-emerald-900/30';
      textColor = 'text-emerald-700 dark:text-emerald-400';
    } else {
      const lowerStatus = status ? status.toLowerCase() : '';
      if (lowerStatus.includes('in progress')) {
        bgColor = 'bg-blue-100 dark:bg-blue-900/30';
        textColor = 'text-blue-700 dark:text-blue-400';
      } else if (lowerStatus.includes('todo') || lowerStatus.includes('to do')) {
        bgColor = 'bg-yellow-100 dark:bg-yellow-900/30';
        textColor = 'text-yellow-700 dark:text-yellow-400';
      } else if (lowerStatus.includes('review')) {
        bgColor = 'bg-purple-100 dark:bg-purple-900/30';
        textColor = 'text-purple-700 dark:text-purple-400';
      } else if (lowerStatus.includes('block')) {
        bgColor = 'bg-red-100 dark:bg-red-900/30';
        textColor = 'text-red-700 dark:text-red-400';
      } else if (lowerStatus.includes('awaiting info')) {
        bgColor = 'bg-orange-100 dark:bg-orange-900/30';
        textColor = 'text-orange-700 dark:text-orange-400';
      } else if (lowerStatus.includes('completed/feedback')) {
        bgColor = 'bg-indigo-100 dark:bg-indigo-900/30';
        textColor = 'text-indigo-700 dark:text-indigo-400';
        text = 'Feedback';
      }
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
        {text}
      </span>
    );
  };

  const formatSeconds = (seconds) => {
    if (seconds === 'N/A') return 'N/A';
    if (seconds < 0) return 'N/A';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    let result = '';
    if (days > 0) result += `${days}d `;
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0) result += `${minutes}m `;
    
    return result.trim() || '0m';
  };

  const calculateDuration = (createdAt, completedAt, completed) => {
    if (!createdAt) return 'N/A';
    try {
      const startDate = new Date(createdAt);
      let endDate;

      if (completed && completedAt) {
        endDate = new Date(completedAt);
      } else if (!completed) {
        endDate = new Date();
      } else {
        return 'N/A'; 
      }

      if (startDate > endDate) return 'Error'; 
      
      const diffTime = Math.abs(endDate - startDate);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        if (diffHours === 0) {
          const diffMinutes = Math.floor(diffTime / (1000 * 60));
          return `${diffMinutes}m`;
        }
        return `${diffHours}h`;
      }
      return `${diffDays}d`;
    } catch (e) {
      return 'Error';
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg" role="alert">
        <strong className="font-semibold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  return (
    <>
      <div className="font-inter">
        {/* Search Filters Section */}
        <div className="mb-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 flex items-center">
              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search Tasks
            </h3>
            {(searchTerms.brand || searchTerms.requester || searchTerms.assignee) && (
              <button
                onClick={clearAllSearches}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center space-x-1 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Clear all</span>
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Brand Search */}
            <div className="relative">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search Brand
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerms.brand}
                  onChange={(e) => handleSearchChange('brand', e.target.value)}
                  placeholder="Type to search brands..."
                  className="w-full pl-8 pr-4 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {searchTerms.brand && (
                  <button
                    onClick={() => handleSearchChange('brand', '')}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Requester Search */}
            <div className="relative">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search Requested By
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerms.requester}
                  onChange={(e) => handleSearchChange('requester', e.target.value)}
                  placeholder="Type to search requesters..."
                  className="w-full pl-8 pr-4 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {searchTerms.requester && (
                  <button
                    onClick={() => handleSearchChange('requester', '')}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Assignee Search */}
            <div className="relative">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search Assignee
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerms.assignee}
                  onChange={(e) => handleSearchChange('assignee', e.target.value)}
                  placeholder="Type to search assignees..."
                  className="w-full pl-8 pr-4 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {searchTerms.assignee && (
                  <button
                    onClick={() => handleSearchChange('assignee', '')}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Search Results Summary */}
          {(searchTerms.brand || searchTerms.requester || searchTerms.assignee) && (
            <div className="mt-3 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-3">
                <span>
                  Showing {sortedTasks.length} of {tasks.length} tasks
                </span>
                {searchTerms.brand && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    Brand: {searchTerms.brand}
                  </span>
                )}
                {searchTerms.requester && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    Requester: {searchTerms.requester}
                  </span>
                )}
                {searchTerms.assignee && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                    Assignee: {searchTerms.assignee}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  {CORE_COLUMNS.map(column => (
                    <th 
                      key={column.key}
                      className={`${column.width} px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-900 dark:hover:text-gray-200 transition-colors`}
                      onClick={() => requestSort(column.key)}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{column.label}</span>
                        <span className="text-gray-400">
                          {sortConfig.key === column.key ? (sortConfig.direction === 'ascending' ? '↑' : '↓') : '↕'}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {isLoading && (
                  <tr>
                    <td colSpan={CORE_COLUMNS.length} className="text-center py-12">
                      <div className="flex justify-center items-center space-x-2">
                        <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-gray-500">Loading tasks...</span>
                      </div>
                    </td>
                  </tr>
                )}
                
                {!isLoading && sortedTasks.length === 0 && (
                  <tr>
                    <td colSpan={CORE_COLUMNS.length} className="text-center py-12 text-gray-500">
                      No tasks found matching your criteria.
                    </td>
                  </tr>
                )}
                
                {!isLoading && sortedTasks.map((task) => (
                  <tr 
                    key={task.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                    onClick={() => handleRowClick(task)}
                  >
                    {/* Brand */}
                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-900 dark:text-gray-100 truncate pr-4">
                        {task.brand || 'N/A'}
                      </div>
                    </td>
                    
                    {/* Status */}
                    <td className="px-4 py-4">
                      {formatStatus(task.completed, task.status)}
                    </td>
                    
                    {/* Requested By */}
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {task.requester || 'N/A'}
                    </td>
                    
                    {/* Assignee */}
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {task.assignee || 'Unassigned'}
                    </td>
                    
                    {/* Deadline */}
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(task.deadline)}
                    </td>
                    
                    {/* Duration */}
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {calculateDuration(task.createdAt, task.completedAt, task.completed)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8">
              <div className="absolute top-4 right-4 flex items-center space-x-4 z-10">
                {/* Total Duration */}
                <div className="text-right">
                  <div className="text-white/80 text-xs">Total Duration</div>
                  <div className="text-xl font-bold">
                    {calculateDuration(selectedTask.createdAt, selectedTask.completedAt, selectedTask.completed)}
                  </div>
                </div>

                {/* Open in Asana Button */}
                <button
                  onClick={() => {
                    // Construct Asana URL using the same logic as the API
                    const workspaceId = '21887210681374'; // Default workspace ID
                    const projectId = '1207673991970095'; // Default project ID
                    const asanaUrl = `https://app.asana.com/1/${workspaceId}/project/${projectId}/task/${selectedTask.id}`;
                    window.open(asanaUrl, '_blank');
                  }}
                  className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm px-3 py-2 rounded-lg transition-all duration-200 border border-white/20 text-sm"
                  title="Open in Asana"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C8.18 0 5.08 3.01 5.08 6.72c0 2.12.93 4.02 2.4 5.34L12 24l4.52-11.94c1.47-1.32 2.4-3.22 2.4-5.34C18.92 3.01 15.82 0 12 0zm0 9.63c-1.61 0-2.91-1.3-2.91-2.91S10.39 3.81 12 3.81s2.91 1.3 2.91 2.91S13.61 9.63 12 9.63z"/>
                  </svg>
                  <span className="font-medium">Open in Asana</span>
                </button>

                {/* Close Button */}
                <button
                  onClick={closeModal}
                  className="flex items-center justify-center w-8 h-8 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-all duration-200 border border-white/20 group"
                  title="Close"
                >
                  <svg 
                    className="w-4 h-4 text-white/80 group-hover:text-white transition-colors" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="flex items-start justify-between pr-64"> {/* Increased padding for new layout */}
                <div className="flex-1 max-w-3xl">
                  <h1 className="text-3xl font-bold mb-2 break-words">{selectedTask.brand || 'Task Details'}</h1>
                  <p className="text-blue-100 text-lg mb-4 break-words">{selectedTask.name || 'Task Information'}</p>
                  <div className="flex items-center space-x-4 flex-wrap">
                    {formatStatus(selectedTask.completed, selectedTask.status)}
                    <span className="text-white/80 text-sm">
                      Created {formatDate(selectedTask.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Key Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Assignee</div>
                      <div className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                        {selectedTask.assignee || 'Unassigned'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Deadline</div>
                      <div className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                        {formatDate(selectedTask.deadline)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">Asset Type</div>
                      <div className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                        {selectedTask.asset || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs text-orange-600 dark:text-orange-400 font-medium">Task Type</div>
                      <div className="text-sm font-semibold text-orange-900 dark:text-orange-100">
                        {selectedTask.taskType || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Task Journey Timeline */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  Task Journey
                </h3>
                
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
                  <div className="flex flex-wrap gap-3">
                    {statusColumns.map((status, index) => {
                      const timeSpent = selectedTask[status];
                      const hasTime = timeSpent && timeSpent !== 'N/A' && parseFloat(timeSpent) > 0;
                      const isLast = index === statusColumns.length - 1;
                      
                      return (
                        <div key={status} className="flex items-center">
                          <div className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                            hasTime 
                              ? 'bg-blue-500 text-white shadow-lg scale-105' 
                              : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-600'
                          }`}>
                            <div className={`w-3 h-3 rounded-full ${
                              hasTime ? 'bg-white' : 'bg-gray-300 dark:bg-gray-500'
                            }`}></div>
                            <div>
                              <div className={`text-sm font-medium ${hasTime ? 'text-white' : ''}`}>
                                {status.trim()}
                              </div>
                              {hasTime && (
                                <div className="text-xs text-blue-100 font-mono">
                                  {formatSeconds(timeSpent)}
                                </div>
                              )}
                            </div>
                          </div>
                          {!isLast && (
                            <div className={`w-8 h-0.5 mx-2 ${
                              hasTime ? 'bg-blue-300' : 'bg-gray-200 dark:bg-gray-600'
                            }`}></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Additional Details Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Team & Ownership */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Team & Ownership
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-600">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Requested By</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {selectedTask.requester || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-600">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Assigned To</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {selectedTask.assignee || 'Unassigned'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Current Status</span>
                      <div>{formatStatus(selectedTask.completed, selectedTask.status)}</div>
                    </div>
                  </div>
                </div>

                {/* Timeline & Dates */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Timeline & Dates
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-600">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Created</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatDate(selectedTask.createdAt)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-600">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Deadline</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatDate(selectedTask.deadline)}
                      </span>
                    </div>
                    {selectedTask.completedAt && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-600">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Completed</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {formatDate(selectedTask.completedAt)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total Duration</span>
                      <span className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400">
                        {calculateDuration(selectedTask.createdAt, selectedTask.completedAt, selectedTask.completed)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}