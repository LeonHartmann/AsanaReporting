import React, { useMemo } from 'react';

export default function TaskSummary({ tasks, avgCycleTime, isLoading }) {
  // Calculate task statistics
  const stats = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return { completed: 0, incomplete: 0, overdue: 0, waitingFeedback: 0, total: 0 };
    }

    // Current date for comparisons (normalized to start of day)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let overdue = 0;
    let completed = 0;
    let incomplete = 0;
    let waitingFeedback = 0;

    tasks.forEach(task => {
      // Check for tasks with "🌀 Completed/Feedback" status
      if (task.status && task.status === "🌀 Completed/Feedback") {
        waitingFeedback++;
        return;
      }
      
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
      waitingFeedback,
      total: tasks.length
    };
  }, [tasks]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 text-center">
        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Avg. Cycle Time</h3>
        <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {isLoading ? '...' : (avgCycleTime !== null ? `${avgCycleTime} days` : 'N/A')}
        </div>
        <span className="text-xs text-gray-400">(Completed Tasks)</span>
      </div>
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 text-center">
        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Completed tasks</h3>
        <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.completed}</div>
      </div>
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 text-center">
        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Incomplete tasks</h3>
        <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.incomplete}</div>
      </div>
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 text-center">
        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Waiting for Feedback from Sales</h3>
        <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.waitingFeedback}</div>
      </div>
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 text-center">
        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Overdue tasks</h3>
        <div className={`text-3xl font-bold ${stats.overdue > 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>{stats.overdue}</div>
      </div>
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 text-center">
        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Total tasks</h3>
        <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
      </div>
    </div>
  );
} 