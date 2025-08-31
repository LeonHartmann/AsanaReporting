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

  const items = [
    { label: 'Completed', value: stats.completed, dot: 'bg-green-500' },
    { label: 'Incomplete', value: stats.incomplete, dot: 'bg-blue-500' },
    { label: 'Waiting Feedback', value: stats.waitingFeedback, dot: 'bg-yellow-500' },
    { label: 'Overdue', value: stats.overdue, dot: 'bg-red-500', accent: stats.overdue > 0 ? 'text-red-600 dark:text-red-400' : '' },
    { label: 'Avg Time', value: isLoading ? '...' : (avgCycleTime !== null ? `${avgCycleTime} d` : 'N/A'), dot: 'bg-purple-500' },
    { label: 'Total', value: stats.total, dot: 'bg-indigo-500' },
  ];

  return (
    <div className="mb-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {items.map(({ label, value, dot, accent }) => (
          <div key={label} className="flex items-baseline justify-between">
            <div className="flex items-center gap-2">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${dot}`} />
              <span className="text-xs uppercase tracking-wide text-customGray-500 dark:text-customGray-400">{label}</span>
            </div>
            <div className={`text-3xl font-semibold text-customGray-900 dark:text-customGray-100 ${accent || ''}`}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
