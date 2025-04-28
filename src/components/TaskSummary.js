import React, { useMemo } from 'react';

export default function TaskSummary({ tasks }) {
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

  return (
    <div className="grid grid-cols-4 gap-4 mb-8">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 text-center">
        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Completed tasks</h3>
        <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.completed}</div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 text-center">
        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Incomplete tasks</h3>
        <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.incomplete}</div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 text-center">
        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Overdue tasks</h3>
        <div className="text-3xl font-bold text-red-500">{stats.overdue}</div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 text-center">
        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Total tasks</h3>
        <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
      </div>
    </div>
  );
} 