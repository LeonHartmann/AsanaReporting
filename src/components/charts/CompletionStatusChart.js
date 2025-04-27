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

  // Group tasks by status (section) and completion
  const statusCounts = {};
  
  tasks.forEach(task => {
    // First check if it's completed
    if (task.completed) {
      statusCounts['Completed'] = (statusCounts['Completed'] || 0) + 1;
      return;
    }
    
    // Use the section or status field
    const status = task.status || 'No Status';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  // Convert to arrays for ChartJS
  const statuses = Object.keys(statusCounts);
  const counts = Object.values(statusCounts);
  
  // Generate colors for chart
  const backgroundColors = statuses.map(status => {
    if (status === 'Completed') return 'rgba(52, 168, 83, 0.7)'; // green for completed
    if (status.toLowerCase().includes('in progress')) return 'rgba(66, 133, 244, 0.7)'; // blue for in progress
    if (status.toLowerCase().includes('todo') || status.toLowerCase().includes('to do')) return 'rgba(251, 188, 5, 0.7)'; // yellow for todo
    if (status.toLowerCase().includes('review')) return 'rgba(170, 107, 228, 0.7)'; // purple for review
    if (status.toLowerCase().includes('block')) return 'rgba(234, 67, 53, 0.7)'; // red for blocked
    return `rgba(${Math.floor(Math.random() * 200)}, ${Math.floor(Math.random() * 200)}, ${Math.floor(Math.random() * 200)}, 0.7)`;
  });
  
  const borderColors = backgroundColors.map(color => color.replace('0.7', '1'));

  const data = {
    labels: statuses,
    datasets: [
      {
        data: counts,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 1,
      },
    ],
  };

  // Base options for both normal and fullscreen modes
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: {
            size: isFullscreen ? 16 : 12
          },
          color: 'rgb(75, 85, 99)',
          padding: isFullscreen ? 20 : 10
        }
      },
      title: {
        display: true,
        text: 'Task Status Distribution',
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
            const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
            const percentage = Math.round((context.raw / total) * 100);
            return `${context.label}: ${context.raw} (${percentage}%)`;
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
    : "bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md h-96 cursor-pointer";

  return (
    <div 
      className={containerClass}
      onClick={onClick}
    > 
      <Doughnut data={data} options={options} />
    </div>
  );
} 