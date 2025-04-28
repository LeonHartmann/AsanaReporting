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

export default function TaskTrendChart({ tasks, onClick, isFullscreen }) {
  if (!tasks || tasks.length === 0) {
    return <div className="text-center text-gray-500 dark:text-gray-400">No task data available for chart.</div>;
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
        fill: false,
        borderColor: 'rgb(75, 192, 192)', // Teal
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
        borderWidth: isFullscreen ? 2 : 1,
        pointRadius: isFullscreen ? 5 : 3,
        pointHoverRadius: isFullscreen ? 8 : 5,
      },
      {
        label: 'Tasks Completed',
        data: completedCounts,
        fill: false,
        borderColor: 'rgb(54, 162, 235)', // Blue
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.1,
        borderWidth: isFullscreen ? 2 : 1,
        pointRadius: isFullscreen ? 5 : 3,
        pointHoverRadius: isFullscreen ? 8 : 5,
      },
    ],
  };

  // Base options for both normal and fullscreen modes
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          font: {
            size: isFullscreen ? 14 : 12
          }
        }
      },
      title: {
        display: true,
        text: 'Task Creation & Completion Trend',
        font: {
          size: isFullscreen ? 24 : 16,
          weight: 'bold'
        },
        padding: {
          top: isFullscreen ? 20 : 10,
          bottom: isFullscreen ? 20 : 10
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        titleFont: {
          size: isFullscreen ? 16 : 12
        },
        bodyFont: {
          size: isFullscreen ? 14 : 12
        },
        padding: isFullscreen ? 12 : 8
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { 
          stepSize: 1,
          precision: 0,
          font: {
            size: isFullscreen ? 14 : 12
          }
        },
        title: {
          display: isFullscreen,
          text: 'Number of Tasks',
          font: {
            size: isFullscreen ? 14 : 12,
            weight: 'bold'
          }
        },
        grid: {
          display: true,
          color: isFullscreen ? 'rgba(200, 200, 200, 0.3)' : 'rgba(200, 200, 200, 0.2)'
        }
      },
      x: {
        ticks: {
          font: {
            size: isFullscreen ? 14 : 12
          },
          maxRotation: isFullscreen ? 0 : 45
        },
        title: {
          display: true,
          text: 'Month',
          font: {
            size: isFullscreen ? 14 : 12,
            weight: isFullscreen ? 'bold' : 'normal'
          }
        },
        grid: {
          display: isFullscreen
        }
      }
    }
  };

  // Additional options for fullscreen mode
  const fullscreenOptions = isFullscreen ? {
    layout: {
      padding: {
        top: 20,
        right: 30,
        bottom: 30,
        left: 20
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    },
    animation: {
      duration: 500
    },
    elements: {
      line: {
        tension: 0.3 // Smoother curve in fullscreen
      }
    }
  } : {};

  // Merge options
  const options = {
    ...baseOptions,
    ...fullscreenOptions
  };

  // Custom container class based on fullscreen state
  const containerClass = isFullscreen
    ? "w-full h-full"
    : "bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md h-96 cursor-pointer";

  return (
    <div 
      id="task-trend-chart"
      data-title="Task Creation & Completion Trend"
      className={containerClass}
      onClick={onClick}
    >
      <Line data={data} options={options} />
    </div>
  );
} 