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

// Updated STATUS_COLORS using the new Tailwind palette
// Hex codes from tailwind.config.js:
// success: '#22c55e', info: '#3b82f6', warning: '#facc15', error: '#ef4444',
// accent.purple: '#8b5cf6', accent.orange: '#f97316', accent.pink: '#ec4899'
// customGray.500: '#6b7280'
const STATUS_COLORS = {
  'Completed': '#22c55e', // success
  'Completed/Feedback': '#4ade80', // secondary.light (a lighter green)
  'In progress': '#3b82f6', // info / primary.DEFAULT
  'In Review': '#8b5cf6', // accent.purple
  'To Do': '#facc15',     // warning
  'Awaiting Info': '#f97316', // accent.orange
  'Blocked': '#ef4444',   // error
  'No Status': '#6b7280', // customGray.500
};
const DEFAULT_COLOR = '#6b7280'; // customGray.500

// Helper to determine text color based on dark mode
// This is a simplified example; a more robust solution might use context or a global store
const getTextColor = () => {
  if (typeof window !== 'undefined' && document.documentElement.classList.contains('dark')) {
    return '#e5e7eb'; // customGray.200 for dark mode
  }
  return '#374151'; // customGray.700 for light mode
};

export default function CompletionStatusChart({ tasks, onClick, isFullscreen }) {
  if (!tasks || tasks.length === 0) {
    return <div className="text-center text-customGray-500 dark:text-customGray-400">No task data available for chart.</div>;
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
    const foundKey = Object.keys(STATUS_COLORS).find(key => key.toLowerCase() === status.toLowerCase());
    return foundKey ? STATUS_COLORS[foundKey] : DEFAULT_COLOR;
  });

  // For Doughnut charts, border color can be slightly darker or same as background
  const borderColors = backgroundColors.map(color => {
    // Simple darken, or could use a library. For now, just use the same color or a fixed darker one.
    // For simplicity, using the same color, as Chart.js will render it.
    // Or, make it slightly more opaque if using RGBA, but we are using hex.
    return color; 
  });

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
        position: isFullscreen ? 'right' : 'bottom',
        labels: {
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: isFullscreen ? 14 : 12
          },
          color: getTextColor(), // Updated color
          padding: isFullscreen ? 20 : 10,
          boxWidth: isFullscreen ? 15 : 10,
          usePointStyle: true,
        }
      },
      title: {
        display: true,
        text: 'Task Status Distribution',
        align: 'center',
        font: {
          family: 'Inter, system-ui, sans-serif',
          size: isFullscreen ? 22 : 18, // Adjusted size
          weight: '600' // semibold
        },
        color: getTextColor(), // Updated color
        padding: {
          top: isFullscreen ? 25 : 15,
          bottom: isFullscreen ? 25 : 15 // Increased padding
        }
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0,0,0,0.8)', // Darker tooltip background
        titleFont: {
          family: 'Inter, system-ui, sans-serif',
          size: isFullscreen ? 15 : 13,
          weight: 'bold',
        },
        bodyFont: {
          family: 'Inter, system-ui, sans-serif',
          size: isFullscreen ? 14 : 12
        },
        titleColor: '#ffffff', // White title text for dark tooltip
        bodyColor: '#ffffff', // White body text for dark tooltip
        padding: isFullscreen ? 14 : 10, // Increased padding
        cornerRadius: 6, // Rounded corners
        displayColors: true, // Show color boxes
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
            const percentage = Math.round((context.raw / total) * 100);
            return `${context.label}: ${context.raw} (${percentage}%)`;
          }
        }
      }
    },
    cutout: isFullscreen ? '55%' : '65%', // Adjusted doughnut cutout
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
    ? "w-full h-full bg-white dark:bg-customGray-800" // Ensure fullscreen modal background matches
    : "bg-white dark:bg-customGray-800 p-4 rounded-xl shadow-lg h-96 cursor-pointer"; // Updated styles: shadow-lg, rounded-xl

  // Effect to update text color on theme change
  // This is a bit of a hack for Chart.js as it doesn't always react to external CSS changes for canvas text
  const chartRef = React.useRef(null);
  React.useEffect(() => {
    const chart = chartRef.current;
    if (chart) {
      const textColor = getTextColor();
      chart.options.plugins.legend.labels.color = textColor;
      chart.options.plugins.title.color = textColor;
      chart.update();
    }
    // Also listen for dark mode changes if possible, for now, relies on initial getTextColor
  }, []); // Re-run if a dark mode state variable changes, if you have one.

  return (
    <div
      id="completion-status-chart"
      data-title="Task Status Distribution"
      className={containerClass}
      onClick={!isFullscreen ? onClick : undefined} // Only allow click to open modal if not already fullscreen
    >
      <Doughnut ref={chartRef} data={data} options={options} />
    </div>
  );
}