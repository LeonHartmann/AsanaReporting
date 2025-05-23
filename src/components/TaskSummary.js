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
    <div className="mb-8">
      {/* Section Header */}
      <div className="flex items-center mb-2">
        <div className="flex items-center">
          <svg className="h-6 w-6 text-customGray-600 dark:text-customGray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <h2 className="text-xl font-semibold text-customGray-900 dark:text-customGray-100">Analytics Overview</h2>
        </div>
      </div>
      
      {/* Subtitle Note */}
      <p className="text-sm text-customGray-500 dark:text-customGray-400 mb-6">Key performance metrics and task completion statistics</p>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Completed Tasks */}
        <div className="bg-white dark:bg-customGray-800 border-l-4 border-green-500 shadow-sm hover:shadow-md transition-shadow duration-200 rounded-lg p-5">
          <h3 className="text-customGray-500 dark:text-customGray-400 text-sm font-medium mb-2">Completed Tasks</h3>
          <div className="text-3xl font-bold text-customGray-900 dark:text-customGray-100">{stats.completed}</div>
        </div>

        {/* Incomplete Tasks */}
        <div className="bg-white dark:bg-customGray-800 border-l-4 border-blue-500 shadow-sm hover:shadow-md transition-shadow duration-200 rounded-lg p-5">
          <h3 className="text-customGray-500 dark:text-customGray-400 text-sm font-medium mb-2">Incomplete Tasks</h3>
          <div className="text-3xl font-bold text-customGray-900 dark:text-customGray-100">{stats.incomplete}</div>
        </div>

        {/* Waiting Feedback */}
        <div className="bg-white dark:bg-customGray-800 border-l-4 border-yellow-500 shadow-sm hover:shadow-md transition-shadow duration-200 rounded-lg p-5">
          <h3 className="text-customGray-500 dark:text-customGray-400 text-sm font-medium mb-2">Waiting Feedback</h3>
          <div className="text-3xl font-bold text-customGray-900 dark:text-customGray-100">{stats.waitingFeedback}</div>
        </div>

        {/* Overdue Tasks */}
        <div className="bg-white dark:bg-customGray-800 border-l-4 border-red-500 shadow-sm hover:shadow-md transition-shadow duration-200 rounded-lg p-5">
          <h3 className="text-customGray-500 dark:text-customGray-400 text-sm font-medium mb-2">Overdue Tasks</h3>
          <div className={`text-3xl font-bold ${stats.overdue > 0 ? 'text-red-600 dark:text-red-400' : 'text-customGray-900 dark:text-customGray-100'}`}>{stats.overdue}</div>
        </div>

        {/* Avg Completion Time */}
        <div className="bg-white dark:bg-customGray-800 border-l-4 border-purple-500 shadow-sm hover:shadow-md transition-shadow duration-200 rounded-lg p-5">
          <h3 className="text-customGray-500 dark:text-customGray-400 text-sm font-medium mb-2">Avg Completion Time</h3>
          <div className="text-3xl font-bold text-customGray-900 dark:text-customGray-100">
            {isLoading ? '...' : (avgCycleTime !== null ? `${avgCycleTime} d` : 'N/A')}
          </div>
        </div>

        {/* Total Tasks */}
        <div className="bg-white dark:bg-customGray-800 border-l-4 border-indigo-500 shadow-sm hover:shadow-md transition-shadow duration-200 rounded-lg p-5">
          <h3 className="text-customGray-500 dark:text-customGray-400 text-sm font-medium mb-2">Total Tasks</h3>
          <div className="text-3xl font-bold text-customGray-900 dark:text-customGray-100">{stats.total}</div>
        </div>
      </div>
    </div>
  );
}