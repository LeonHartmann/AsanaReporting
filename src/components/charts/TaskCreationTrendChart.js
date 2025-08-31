import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

import { getTextColor, createVerticalGradient, observeTheme } from './chartUtils';

export default function TaskTrendChart({ tasks }) {
  if (!tasks || tasks.length === 0) {
    return <div className="text-center text-customGray-500 dark:text-customGray-400">No task data available for chart.</div>;
  }

  // Calculate task creation counts per month
  const tasksCreatedPerMonth = tasks.reduce((acc, task) => {
    if (task.createdAt) {
      try {
        const date = new Date(task.createdAt);
        // Format as 'YYYY-MM' for easy sorting and labeling
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        acc[monthKey] = (acc[monthKey] || 0) + 1;
      } catch (e) {
        console.error(`Invalid date format for task ${task.id}: ${task.createdAt}`);
      }
    }
    return acc;
  }, {});

  // Calculate task completion counts per month
  const tasksCompletedPerMonth = tasks.reduce((acc, task) => {
    if (task.completed) {
      // For completed tasks, we can use task.completed_at if available, otherwise we may not know when it was completed
      // For the purpose of this example, we'll use the createdAt date if completed_at is not available
      // In a real implementation, you would use the actual completion date from the API
      const completedDate = task.createdAt; // Replace with task.completed_at when available in the API
      if (completedDate) {
        try {
          const date = new Date(completedDate);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          acc[monthKey] = (acc[monthKey] || 0) + 1;
        } catch (e) {
          console.error(`Invalid date format for completed task ${task.id}: ${completedDate}`);
        }
      }
    }
    return acc;
  }, {});

  // Combine all month keys from both objects to ensure we have all months
  const allMonthKeys = [...new Set([
    ...Object.keys(tasksCreatedPerMonth), 
    ...Object.keys(tasksCompletedPerMonth)
  ])].sort();

  // Format labels for display - convert YYYY-MM to more readable format
  const formatMonthLabel = (monthKey) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  };

  const labels = allMonthKeys.map(formatMonthLabel);
  const createdCounts = allMonthKeys.map(month => tasksCreatedPerMonth[month] || 0);
  const completedCounts = allMonthKeys.map(month => tasksCompletedPerMonth[month] || 0);

  const data = {
    labels,
    datasets: [
      {
        label: 'Tasks Created',
        data: createdCounts,
        fill: true,
        borderColor: '#3b82f6',
        backgroundColor: (ctx) => {
          const { chart } = ctx;
          const { ctx: c, chartArea } = chart;
          if (!chartArea) return '#3b82f6';
          return createVerticalGradient(c, chartArea, 'rgba(59,130,246,0.18)', 'rgba(59,130,246,0.02)');
        },
        tension: 0.3,
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 3, // Same as regular to prevent hover growth
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#3b82f6',
        pointBorderWidth: 0,
      },
      {
        label: 'Tasks Completed',
        data: completedCounts,
        fill: true,
        borderColor: '#22c55e',
        backgroundColor: (ctx) => {
          const { chart } = ctx;
          const { ctx: c, chartArea } = chart;
          if (!chartArea) return '#22c55e';
          return createVerticalGradient(c, chartArea, 'rgba(34,197,94,0.18)', 'rgba(34,197,94,0.02)');
        },
        tension: 0.3,
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 3, // Same as regular to prevent hover growth
        pointBackgroundColor: '#22c55e',
        pointBorderColor: '#22c55e',
        pointBorderWidth: 0,
      },
    ],
  };

  const textColor = getTextColor();

  // Custom plugin to display numbers on data points
  const customLabelsPlugin = {
    id: 'customLabels',
    afterDatasetsDraw: (chart) => {
      const ctx = chart.ctx;
      const datasets = chart.data.datasets;

      // For each data point index, determine which line is higher and position accordingly
      const dataLength = datasets[0].data.length;
      
      for (let index = 0; index < dataLength; index++) {
        const createdDataset = datasets[0];
        const completedDataset = datasets[1];
        const createdMeta = chart.getDatasetMeta(0);
        const completedMeta = chart.getDatasetMeta(1);
        
        const createdPoint = createdMeta.data[index];
        const completedPoint = completedMeta.data[index];
        const createdValue = createdDataset.data[index];
        const completedValue = completedDataset.data[index];
        
        // Determine which line is higher (lower y-coordinate means higher on screen)
        const createdIsHigher = createdPoint.y <= completedPoint.y;
        
        // Draw created tasks number
        if (createdValue > 0) {
          const x = createdPoint.x;
          const y = createdIsHigher ? createdPoint.y - 15 : createdPoint.y + 12; // Very close to line
          
          ctx.fillStyle = '#3b82f6'; // Use line color for created tasks
          ctx.font = `600 12px Inter, system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = createdIsHigher ? 'bottom' : 'top';
          ctx.fillText(createdValue.toString(), x, y);
        }
        
        // Draw completed tasks number
        if (completedValue > 0) {
          const x = completedPoint.x;
          const y = createdIsHigher ? completedPoint.y + 12 : completedPoint.y - 15; // Very close to line
          
          ctx.fillStyle = '#22c55e'; // Use line color for completed tasks
          ctx.font = `600 12px Inter, system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = createdIsHigher ? 'top' : 'bottom';
          ctx.fillText(completedValue.toString(), x, y);
        }
      }
    }
  };

  // Base options
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'none', // Disable hover interactions
    },
    hover: {
      mode: 'none', // Disable hover effects
    },
    animation: {
      duration: 0, // No animations
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 12,
            weight: '500',
          },
          color: textColor,
          usePointStyle: true,
          boxWidth: 8,
          padding: 10,
        }
      },
      title: {
        display: false,
        text: 'Task Creation & Completion Trend',
        align: 'center',
        font: {
          family: 'Inter, system-ui, sans-serif',
          size: 20,
          weight: '600'
        },
        color: textColor,
        padding: {
          top: 0,
          bottom: 25
        }
      },
      tooltip: {
        enabled: false, // Disable tooltips completely
      }
    },
    scales: {
      y: {
        display: false, // Hide y-axis for cleaner look
      },
      x: {
        ticks: {
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 13,
            weight: '500',
          },
          color: textColor,
          maxRotation: 0,
          padding: 12,
        },
        grid: {
          display: false, // Remove grid lines
        },
        border: {
          display: false, // Remove x-axis border
        },
      }
    },
    elements: {
      point: {
        radius: 3,
        hoverRadius: 3, // Same as regular radius to prevent hover growth
        borderWidth: 0,
      },
      line: {
        borderWidth: 2,
        tension: 0.3,
      }
    },
    layout: {
      padding: {
        top: 25,
        right: 20,
        bottom: 15,
        left: 20,
      }
    },
  };

  // Custom container class - removed background, shadow, and rounded corners for clean look
  const containerClass = "p-4 h-96";

  // Effect to update text color on theme change
  const chartRef = React.useRef(null);
  React.useEffect(() => {
    const chart = chartRef.current;
    if (chart) {
      const newTextColor = getTextColor();
      chart.options.plugins.legend.labels.color = newTextColor;
      chart.options.plugins.title.color = newTextColor;
      chart.options.scales.x.ticks.color = newTextColor;
      chart.update('none');
    }
    const disconnect = observeTheme(() => {
      const ch = chartRef.current;
      if (ch) {
        const c = getTextColor();
        ch.options.plugins.legend.labels.color = c;
        ch.options.plugins.title.color = c;
        ch.options.scales.x.ticks.color = c;
        ch.update('none');
      }
    });
    return disconnect;
  }, []);

  return (
    <div
      id="task-trend-chart"
      data-title="Task Creation & Completion Trend"
      className={containerClass}
    >
      <Line ref={chartRef} data={data} options={baseOptions} plugins={[customLabelsPlugin]} />
    </div>
  );
}
