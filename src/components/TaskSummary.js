import React, { useMemo } from 'react';

export default function TaskSummary({ tasks }) {
  // Calculate task statistics
  const stats = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return { completed: 0, incomplete: 0, overdue: 0, total: 0 };
    }
    
    // Create date with time set to start of day to handle date-only comparisons
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    return {
      completed: tasks.filter(task => task.completed).length,
      incomplete: tasks.filter(task => !task.completed).length,
      // Modified overdue logic:
      // 1. Task is not completed
      // 2. Task has a due date
      // 3. Due date is earlier than today
      // 4. Also check for 'is_overdue' flag if it exists in the API data
      overdue: tasks.filter(task => {
        if (task.completed) return false;
        
        // Check if there's a specific 'is_overdue' flag
        if (task.is_overdue) return true;
        
        // If task has a due_date, parse it properly
        if (task.due_date) {
          const dueDate = new Date(task.due_date);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate < now;
        }
        
        // Also check due_on which might be used instead of due_date
        if (task.due_on) {
          const dueDate = new Date(task.due_on);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate < now;
        }
        
        return false;
      }).length,
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