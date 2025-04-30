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

// Define a fixed color map for statuses
const STATUS_COLORS = {
  'Completed': 'rgba(52, 168, 83, 0.7)',        // Green
  'Completed/Feedback': 'rgba(150, 200, 100, 0.7)', // Light Green-ish (Adjust as needed)
  'In progress': 'rgba(66, 133, 244, 0.7)',    // Blue
  'In Review': 'rgba(170, 107, 228, 0.7)',      // Purple
  'To Do': 'rgba(251, 188, 5, 0.7)',         // Yellow
  'Awaiting Info': 'rgba(231, 141, 53, 0.7)', // Orange (Adjusted slightly from Blocked)
  'Blocked': 'rgba(234, 67, 53, 0.7)',       // Red
  'No Status': 'rgba(158, 158, 158, 0.7)',     // Grey
  // Add other potential statuses here if known
};
const DEFAULT_COLOR = 'rgba(158, 158, 158, 0.7)'; // Grey for unknown statuses

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
    
    // Use the section or status field - Prioritize Asana section name if available
    // Assuming sections might look like "Sprint Backlog [In progress]" or just "To Do"
    let status = task.section_name || task.status || 'No Status';

    // Normalize common variations
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('in progress')) status = 'In progress';
    else if (lowerStatus.includes('review')) status = 'In Review';
    else if (lowerStatus.includes('todo') || lowerStatus.includes('to do')) status = 'To Do';
    else if (lowerStatus.includes('awaiting')) status = 'Awaiting Info'; // Map 'Awaiting Info'
    else if (lowerStatus.includes('feedback')) status = 'Completed/Feedback'; // Map 'Feedback'
    else if (lowerStatus.includes('block')) status = 'Blocked';

    // If task is not marked completed but is in a "Completed/Feedback" section
    if (status === 'Completed/Feedback' && !task.completed) {
         statusCounts['Completed/Feedback'] = (statusCounts['Completed/Feedback'] || 0) + 1;
         return;
    }

    // Increment count for the determined status
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  // Convert to arrays for ChartJS
  const statuses = Object.keys(statusCounts);
  const counts = Object.values(statusCounts);
  
  // Generate colors for chart using the fixed map
  const backgroundColors = statuses.map(status => {
    // Find a matching key in STATUS_COLORS (case-insensitive check just in case)
    const foundKey = Object.keys(STATUS_COLORS).find(key => key.toLowerCase() === status.toLowerCase());
    return foundKey ? STATUS_COLORS[foundKey] : DEFAULT_COLOR; // Use default color if status not found
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
        align: 'center',
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
      id="completion-status-chart"
      data-title="Task Status Distribution"
      className={containerClass}
      onClick={onClick}
    > 
      <Doughnut data={data} options={options} />
    </div>
  );
} 