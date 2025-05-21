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
      <div className="p-6 text-center text-customGray-500 dark:text-customGray-400">
        No task data available for charts. Please load some tasks first.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-customGray-100 dark:bg-customGray-900 rounded-lg"> {/* Added gap, padding, and bg */}
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
      <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-primary-light/30 dark:bg-primary-dark/40 p-5 rounded-lg text-center text-sm shadow"> {/* Adjusted background, padding, shadow */}
        <p className="text-primary-dark dark:text-primary-light font-medium"> {/* Adjusted text colors and weight */}
          <span className="font-bold text-primary dark:text-primary-light">Pro Tip:</span> Click on any chart to view it in fullscreen mode for better visibility and more details!
        </p>
      </div>
    </div>
  );
}