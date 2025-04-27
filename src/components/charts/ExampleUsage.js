import React from 'react';
import ChartContainer from './ChartContainer';
import CompletionStatusChart from './CompletionStatusChart';
import TaskCreationTrendChart from './TaskCreationTrendChart';
import TasksByAssetChart from './TasksByAssetChart';
import TasksByAssigneeChart from './TasksByAssigneeChart';
import TasksByBrandChart from './TasksByBrandChart';
import TasksByRequesterChart from './TasksByRequesterChart';

/**
 * Example dashboard component showing how to use charts with fullscreen functionality
 */
export default function ChartsDashboard({ tasks }) {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        No task data available for charts. Please load some tasks first.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {/* Completion Status Chart */}
      <ChartContainer
        title="Task Completion Status"
        renderChart={(props) => (
          <CompletionStatusChart tasks={tasks} {...props} />
        )}
      />
      
      {/* Task Creation Trend Chart */}
      <ChartContainer
        title="Task Creation Trend by Month"
        renderChart={(props) => (
          <TaskCreationTrendChart tasks={tasks} {...props} />
        )}
      />
      
      {/* Tasks by Asset Chart */}
      <ChartContainer
        title="Tasks by Asset Type"
        renderChart={(props) => (
          <TasksByAssetChart tasks={tasks} {...props} />
        )}
      />
      
      {/* Tasks by Assignee Chart */}
      <ChartContainer
        title="Tasks by Assignee"
        renderChart={(props) => (
          <TasksByAssigneeChart tasks={tasks} {...props} />
        )}
      />
      
      {/* Tasks by Brand Chart */}
      <ChartContainer
        title="Tasks by Brand"
        renderChart={(props) => (
          <TasksByBrandChart tasks={tasks} {...props} />
        )}
      />
      
      {/* Tasks by Requester Chart - This chart shows how truncation works in normal view */}
      <ChartContainer
        title="Tasks by Requester"
        renderChart={(props) => (
          <TasksByRequesterChart tasks={tasks} {...props} />
        )}
      />
      
      {/* Instructions for users */}
      <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-blue-50 dark:bg-blue-900 p-4 rounded-lg text-center text-sm">
        <p className="text-blue-700 dark:text-blue-200">
          <span className="font-bold">Pro Tip:</span> Click on any chart to view it in fullscreen mode for better visibility and more details!
        </p>
      </div>
    </div>
  );
} 