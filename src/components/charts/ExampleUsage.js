import React from 'react';
import ChartContainer from './ChartContainer';
import CompletionStatusChart from './CompletionStatusChart';
import TaskCreationTrendChart from './TaskCreationTrendChart';
import TasksByAssetChart from './TasksByAssetChart';
import TasksByAssigneeChart from './TasksByAssigneeChart';
import TasksByBrandChart from './TasksByBrandChart';
import TasksByRequesterChart from './TasksByRequesterChart';

export default function ChartsDashboard({ tasks }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
      
      {/* Tasks by Requester Chart */}
      <ChartContainer
        title="Tasks by Requester"
        renderChart={(props) => (
          <TasksByRequesterChart tasks={tasks} {...props} />
        )}
      />
    </div>
  );
} 