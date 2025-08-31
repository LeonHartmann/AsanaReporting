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
  'Completed': '#22c55e',
  'Completed/Feedback': '#4ade80',
  'In progress': '#3b82f6',
  'In Review': '#8b5cf6',
  'To Do': '#facc15',
  'Awaiting Info': '#f97316',
  'Blocked': '#ef4444',
  'No Status': '#6b7280',
};
const DEFAULT_COLOR = '#6b7280';

// Helper to determine text color based on dark mode
// This is a simplified example; a more robust solution might use context or a global store
import { getTextColor, getMutedTextColor, observeTheme } from './chartUtils';

export default function CompletionStatusChart({ tasks }) {
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

  // Convert to arrays for ChartJS (sorted by count desc for better legibility)
  const entries = Object.entries(statusCounts).sort((a, b) => b[1] - a[1]);
  const statuses = entries.map(([k]) => k);
  const counts = entries.map(([, v]) => v);

  const total = counts.reduce((a, b) => a + b, 0);
  const completedCount = statusCounts['Completed'] || 0;
  const completedRate = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  
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
        borderWidth: 0, // Remove borders
      },
    ],
  };

  // Base options for both normal and fullscreen modes
  // Custom plugin to draw center labels (total + completion rate)
  const centerLabelPlugin = {
    id: 'centerLabel',
    afterDraw: (chart) => {
      const { ctx, chartArea: { width, height } } = chart;
      const centerX = chart.getDatasetMeta(0).data[0]?.x || width / 2;
      const centerY = chart.getDatasetMeta(0).data[0]?.y || height / 2;

      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = getMutedTextColor();
      ctx.font = '600 12px Inter, system-ui, sans-serif';
      ctx.fillText('Total', centerX, centerY - 6);

      ctx.fillStyle = getTextColor();
      ctx.font = '700 18px Inter, system-ui, sans-serif';
      ctx.fillText(String(total), centerX, centerY + 14);

      // Secondary metric: completion rate
      ctx.fillStyle = getMutedTextColor();
      ctx.font = '600 11px Inter, system-ui, sans-serif';
      ctx.fillText(`${completedRate}% completed`, centerX, centerY + 32);
      ctx.restore();
    }
  };

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
        position: 'bottom',
        labels: {
          font: { family: 'Inter, system-ui, sans-serif', size: 12, weight: '500' },
          color: getTextColor(),
          padding: 10,
          boxWidth: 10,
          usePointStyle: true,
        }
      },
      title: {
        display: false,
        text: 'Task Status Distribution',
        align: 'center',
        font: {
          family: 'Inter, system-ui, sans-serif',
          size: 20,
          weight: '600',
        },
        color: getTextColor(),
        padding: {
          top: 0,
          bottom: 25,
        }
      },
      tooltip: {
        enabled: false, // Disable tooltips completely
      }
    },
    rotation: -90, // Start at top
    circumference: 360,
    cutout: '70%',
    elements: {
      arc: {
        borderWidth: 0, // Remove borders on arc elements
      }
    },
  };

  // Custom container class - removed isFullscreen and cursor-pointer
  const containerClass = "p-4 h-80";

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
    const disconnect = observeTheme(() => {
      const ch = chartRef.current;
      if (ch) {
        const c = getTextColor();
        ch.options.plugins.legend.labels.color = c;
        ch.options.plugins.title.color = c;
        ch.update('none');
      }
    });
    return disconnect;
  }, []);

  return (
    <div
      id="completion-status-chart"
      data-title="Task Status Distribution"
      className={containerClass}
    >
      <Doughnut ref={chartRef} data={data} options={baseOptions} plugins={[centerLabelPlugin]} />
    </div>
  );
}
