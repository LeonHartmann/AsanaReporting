import React, { useMemo, useState } from 'react';
import { differenceInHours, differenceInDays, parseISO } from 'date-fns';

const TIME_FRAMES = {
  LT_24H: 'Less than 24h',
  LT_7D: 'Less than 7 Days',
  LT_14D: 'Less than 14 Days',
  LT_1M: 'Less than 1 Month',
  GE_1M: 'More than 1 Month',
};

export default function CompletionRateSummary({ tasks, isLoading }) {
  const [isExpanded, setIsExpanded] = useState(false);

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

  // Get fastest completion metrics for summary
  const fastestCount = completionStats[TIME_FRAMES.LT_24H];
  const weekCount = completionStats[TIME_FRAMES.LT_7D];
  const slowestCount = completionStats[TIME_FRAMES.GE_1M];
  const totalCompleted = Object.values(completionStats).reduce((sum, count) => sum + count, 0);

  const renderStatCard = (label, value) => (
    <div key={label} className="bg-white dark:bg-customGray-800 rounded-lg p-4 text-center shadow-sm">
      <h3 className="text-customGray-600 dark:text-customGray-400 text-sm font-medium mb-2">{label}</h3>
      <div className="text-2xl font-bold text-customGray-900 dark:text-customGray-100">
        {isLoading ? '...' : value}
      </div>
    </div>
  );

  return (
    <div className="mb-8">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full bg-white dark:bg-customGray-800 rounded-xl shadow-lg p-6 text-left hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-customGray-900 dark:text-customGray-100 mb-2">
              Task Completion Rate
            </h3>
            <div className="text-sm text-customGray-600 dark:text-customGray-400">
              {isLoading ? (
                'Loading completion data...'
              ) : totalCompleted > 0 ? (
                <>
                  <span className="font-medium text-secondary">Fast</span>
                  <span className="ml-1">({fastestCount} &lt;24h)</span>
                  <span className="mx-2">•</span>
                  <span className="font-medium text-primary">Weekly</span>
                  <span className="ml-1">({weekCount} &lt;7d)</span>
                  <span className="mx-2">•</span>
                  <span className="font-medium text-warning">Slow</span>
                  <span className="ml-1">({slowestCount} &gt;1mo)</span>
                </>
              ) : (
                'No completed tasks with timing data'
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary">{isLoading ? '...' : totalCompleted}</span>
            <svg
              className={`w-5 h-5 text-customGray-400 transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      {/* Expandable Content */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-customGray-50 dark:bg-customGray-700/50 rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {Object.entries(completionStats).map(([label, value]) => renderStatCard(label, value))}
          </div>
        </div>
      </div>
    </div>
  );
} 