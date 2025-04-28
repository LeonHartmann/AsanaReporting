import React, { useMemo } from 'react';

export default function TaskSummary({ tasks, onFilterChange }) {
  // Calculate task statistics
  const stats = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return { completed: 0, incomplete: 0, overdue: 0, total: 0 };
    }
    
    const now = new Date();
    
    return {
      completed: tasks.filter(task => task.completed).length,
      incomplete: tasks.filter(task => !task.completed).length,
      overdue: tasks.filter(task => 
        !task.completed && 
        task.due_date && 
        new Date(task.due_date) < now
      ).length,
      total: tasks.length
    };
  }, [tasks]);

  // Handle card clicks to filter
  const handleFilterCompleted = () => onFilterChange && onFilterChange('completed');
  const handleFilterIncomplete = () => onFilterChange && onFilterChange('incomplete');
  const handleFilterOverdue = () => onFilterChange && onFilterChange('overdue');
  const handleFilterAll = () => onFilterChange && onFilterChange('');

  return (
    <div className="grid grid-cols-4 gap-4 mb-8">
      <div 
        className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 text-center cursor-pointer hover:shadow-lg transition-all" 
        onClick={handleFilterCompleted}
      >
        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Completed tasks</h3>
        <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.completed}</div>
        <div className="text-xs text-gray-400">↑ Filter</div>
      </div>
      
      <div 
        className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 text-center cursor-pointer hover:shadow-lg transition-all" 
        onClick={handleFilterIncomplete}
      >
        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Incomplete tasks</h3>
        <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.incomplete}</div>
        <div className="text-xs text-gray-400">↑ Filter</div>
      </div>
      
      <div 
        className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 text-center cursor-pointer hover:shadow-lg transition-all" 
        onClick={handleFilterOverdue}
      >
        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Overdue tasks</h3>
        <div className="text-3xl font-bold text-red-500">{stats.overdue}</div>
        <div className="text-xs text-gray-400">↑ Filter</div>
      </div>
      
      <div 
        className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 text-center cursor-pointer hover:shadow-lg transition-all" 
        onClick={handleFilterAll}
      >
        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Total tasks</h3>
        <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
        <div className="text-xs text-gray-400">Show All</div>
      </div>
    </div>
  );
} 