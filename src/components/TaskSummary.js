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

  // Common card classes
  const cardClasses = "bg-white dark:bg-customGray-800 shadow-lg rounded-xl p-5 text-center flex flex-col justify-between font-sans";
  const titleClasses = "text-customGray-500 dark:text-customGray-400 text-sm font-medium mb-2"; // Increased mb
  const valueClasses = "text-3xl font-bold text-customGray-900 dark:text-customGray-100";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8"> {/* Increased gap */}
      <div className={cardClasses}>
        <h3 className={titleClasses}>Completed Tasks</h3>
        <div className={valueClasses}>{stats.completed}</div>
      </div>
      <div className={cardClasses}>
        <h3 className={titleClasses}>Incomplete Tasks</h3>
        <div className={valueClasses}>{stats.incomplete}</div>
      </div>
      <div className={cardClasses}>
        <h3 className={titleClasses}>Waiting Feedback</h3>
        <div className={valueClasses}>{stats.waitingFeedback}</div>
      </div>
      <div className={cardClasses}>
        <h3 className={titleClasses}>Overdue Tasks</h3>
        <div className={`text-3xl font-bold ${stats.overdue > 0 ? 'text-error' : 'text-customGray-900 dark:text-customGray-100'}`}>{stats.overdue}</div>
      </div>
      <div className={cardClasses}>
        <h3 className={titleClasses}>Avg Completion Time</h3>
        <div className={valueClasses}>
            {isLoading ? '...' : (avgCycleTime !== null ? `${avgCycleTime} d` : 'N/A')} {/* Shortened "days" to "d" */}
        </div>
      </div>
      <div className={cardClasses}>
        <h3 className={titleClasses}>Total Tasks</h3>
        <div className={valueClasses}>{stats.total}</div>
      </div>
    </div>
  );
}