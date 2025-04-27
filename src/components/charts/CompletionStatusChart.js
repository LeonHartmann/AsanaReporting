import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title
} from 'chart.js';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  Title
);

export default function CompletionStatusChart({ tasks, onClick, isFullscreen }) {
  if (!tasks || tasks.length === 0) {
    return <div className="text-center text-gray-500 dark:text-gray-400">No task data available for chart.</div>;
  }

  const completedCount = tasks.filter(task => task.completed).length;
  const incompleteCount = tasks.length - completedCount;
  const totalTasks = tasks.length;

  const data = {
    labels: ['Completed', 'Incomplete'],
    datasets: [
      {
        label: '# of Tasks',
        data: [completedCount, incompleteCount],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)', // Completed color (Teal)
          'rgba(255, 99, 132, 0.6)', // Incomplete color (Red)
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: isFullscreen ? 2 : 1,
      },
    ],
  };

  // Base options for both normal and fullscreen modes
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: isFullscreen ? 16 : 12
          },
          padding: isFullscreen ? 20 : 10
        }
      },
      title: {
        display: true,
        text: 'Task Completion Status',
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
        titleFont: {
          size: isFullscreen ? 16 : 12
        },
        bodyFont: {
          size: isFullscreen ? 14 : 12
        },
        padding: isFullscreen ? 12 : 8,
        callbacks: {
          label: function(context) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed !== null) {
               const value = context.parsed;
               const percentage = ((value / totalTasks) * 100).toFixed(1);
               label += `${value} (${percentage}%)`;
            }
            return label;
          }
        }
      }
    },
    cutout: isFullscreen ? '50%' : '60%', // Wider doughnut in fullscreen mode
  };

  // Additional options for fullscreen mode
  const fullscreenOptions = isFullscreen ? {
    layout: {
      padding: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20
      }
    },
    animation: {
      duration: 500
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
    : "bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md h-80 cursor-pointer";

  return (
    <div 
      className={containerClass}
      onClick={onClick}
    > 
      <Doughnut data={data} options={options} />
    </div>
  );
} 