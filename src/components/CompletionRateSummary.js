import React, { useMemo } from 'react';
import { differenceInHours, differenceInDays, parseISO } from 'date-fns';

const TIME_FRAMES = {
  LT_24H: 'Less than 24h',
  LT_7D: 'Less than 7 Days',
  LT_14D: 'Less than 14 Days',
  LT_1M: 'Less than 1 Month',
  GE_1M: 'More than 1 Month',
};

export default function CompletionRateSummary({ tasks, isLoading }) {
  const completionStats = useMemo(() => {
    if (!tasks) {
      return { [TIME_FRAMES.LT_24H]: 0, [TIME_FRAMES.LT_7D]: 0, [TIME_FRAMES.LT_14D]: 0, [TIME_FRAMES.LT_1M]: 0, [TIME_FRAMES.GE_1M]: 0 };
    }

    const counts = {
      [TIME_FRAMES.LT_24H]: 0,
      [TIME_FRAMES.LT_7D]: 0,
      [TIME_FRAMES.LT_14D]: 0,
      [TIME_FRAMES.LT_1M]: 0,
      [TIME_FRAMES.GE_1M]: 0,
    };

    const completedTasks = tasks.filter(t => t.completed && t.completedAt && t.createdAt);

    completedTasks.forEach(task => {
      try {
        const completedDate = parseISO(task.completedAt);
        const createdDate = parseISO(task.createdAt);

        // Ensure dates are valid
        if (isNaN(completedDate.getTime()) || isNaN(createdDate.getTime())) {
          console.warn(`Invalid date found for task ${task.id}`);
          return; 
        }

        const diffHours = differenceInHours(completedDate, createdDate);
        const diffDays = differenceInDays(completedDate, createdDate);

        if (diffHours < 24 && diffHours >= 0) { // Ensure non-negative
          counts[TIME_FRAMES.LT_24H]++;
        } else if (diffDays < 7 && diffDays >= 0) {
          counts[TIME_FRAMES.LT_7D]++;
        } else if (diffDays < 14 && diffDays >= 0) {
          counts[TIME_FRAMES.LT_14D]++;
        } else if (diffDays < 30 && diffDays >= 0) { // Using 30 days as approx 1 month
          counts[TIME_FRAMES.LT_1M]++;
        } else if (diffDays >= 30) {
          counts[TIME_FRAMES.GE_1M]++;
        } 
        // Tasks with negative duration (completed before created?) are ignored by the conditions above

      } catch (e) {
        console.warn(`Error processing completion time for task ${task.id}:`, e);
      }
    });

    return counts;
  }, [tasks]);

  const renderStatCard = (label, value) => (
    <div key={label} className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 text-center">
      <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">{label}</h3>
      <div className="text-3xl font-bold text-gray-900 dark:text-white">
        {isLoading ? '...' : value}
      </div>
    </div>
  );

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Task Completion Rate</h2>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {Object.entries(completionStats).map(([label, value]) => renderStatCard(label, value))}
      </div>
    </div>
  );
} 