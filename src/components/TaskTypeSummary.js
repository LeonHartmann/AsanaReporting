import React, { useMemo } from 'react';

export default function TaskTypeSummary({ tasks }) {
  // Calculate task type statistics
  const taskTypeStats = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return [];
    }

    // Count tasks by task type
    const taskTypeCounts = {};
    
    tasks.forEach(task => {
      const taskType = task.taskType || 'N/A';
      taskTypeCounts[taskType] = (taskTypeCounts[taskType] || 0) + 1;
    });

    // Convert to array for rendering
    return Object.entries(taskTypeCounts).map(([taskType, count]) => ({
      taskType,
      count
    })).sort((a, b) => b.count - a.count); // Sort by count in descending order
  }, [tasks]);

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 mb-8">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tasks by Task Type</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {taskTypeStats.map(({ taskType, count }) => (
          <div key={taskType} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
            <h4 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1 truncate" title={taskType}>
              {taskType}
            </h4>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{count}</div>
          </div>
        ))}
      </div>
    </div>
  );
} 