import React, { useMemo } from 'react';

export default function TaskSummary({ tasks }) {
  // Calculate task statistics
  const stats = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return { completed: 0, incomplete: 0, overdue: 0, total: 0 };
    }

    // Current date for comparisons (normalized to start of day)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let overdue = 0;
    let completed = 0;
    let incomplete = 0;

    tasks.forEach(task => {
      if (task.completed) {
        completed++;
        return;
      }
      incomplete++;
      // Use the same logic as TasksByDeadlineChart
      if (!task.deadline) return;
      const deadlineDate = new Date(task.deadline);
      if (isNaN(deadlineDate.getTime())) return;
      const normalizedDeadline = new Date(
        deadlineDate.getFullYear(),
        deadlineDate.getMonth(),
        deadlineDate.getDate()
      );
      if (normalizedDeadline < today) {
        overdue++;
      }
    });

    return {
      completed,
      incomplete,
      overdue,
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