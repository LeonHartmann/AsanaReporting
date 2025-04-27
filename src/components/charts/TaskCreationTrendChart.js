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

export default function TaskCreationTrendChart({ tasks, onClick, isFullscreen }) {
  if (!tasks || tasks.length === 0) {
    return <div className="text-center text-gray-500 dark:text-gray-400">No task data available for chart.</div>;
  }

  // Calculate task counts per month
  const tasksPerMonth = tasks.reduce((acc, task) => {
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

  // Sort months chronologically
  const sortedMonths = Object.keys(tasksPerMonth).sort();

  // Format labels for display - convert YYYY-MM to more readable format
  const formatMonthLabel = (monthKey) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  };

  const labels = isFullscreen 
    ? sortedMonths.map(formatMonthLabel) 
    : sortedMonths.map(m => formatMonthLabel(m));
  const dataCounts = sortedMonths.map(month => tasksPerMonth[month]);

  const data = {
    labels,
    datasets: [
      {
        label: 'Tasks Created',
        data: dataCounts,
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
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
        display: false,
      },
      title: {
        display: true,
        text: 'Task Creation Trend by Month',
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
        padding: isFullscreen ? 12 : 8,
        callbacks: {
          label: function(context) {
            return ` Tasks Created: ${context.parsed.y}`;
          }
        }
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
      className={containerClass}
      onClick={onClick}
    >
      <Line data={data} options={options} />
    </div>
  );
} 