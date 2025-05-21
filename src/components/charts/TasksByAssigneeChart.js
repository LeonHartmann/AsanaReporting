import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// ChartJS registration is already done in other chart files, 
// but it's safe to include here too. It won't re-register.
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Helper to determine text color based on dark mode
const getTextColor = () => {
  if (typeof window !== 'undefined' && document.documentElement.classList.contains('dark')) {
    return '#e5e7eb'; // customGray.200 for dark mode text
  }
  return '#374151'; // customGray.700 for light mode text
};

// Helper to determine grid color based on dark mode
const getGridColor = () => {
  if (typeof window !== 'undefined' && document.documentElement.classList.contains('dark')) {
    return 'rgba(75, 85, 99, 0.4)'; // customGray.600 with alpha for dark mode grid
  }
  return 'rgba(209, 213, 219, 0.6)'; // customGray.300 with alpha for light mode grid
};

export default function TasksByAssigneeChart({ tasks, onClick, isFullscreen }) { // Added isFullscreen prop for consistency
  if (!tasks || tasks.length === 0) {
    return <div className="text-center text-customGray-500 dark:text-customGray-400 py-10">No task data available for chart.</div>;
  }

  // Calculate task counts per assignee
  const assigneeCounts = tasks.reduce((acc, task) => {
    // Use 'Unassigned' if task.assignee is null/undefined or if name is missing
    const assignee = task.assignee || 'Unassigned'; 
    acc[assignee] = (acc[assignee] || 0) + 1;
    return acc;
  }, {});

  // Sort assignees by task count descending for better visualization
  const sortedAssignees = Object.entries(assigneeCounts)
    .sort(([, countA], [, countB]) => countB - countA);

  const labels = sortedAssignees.map(([assignee]) => assignee);
  const dataCounts = sortedAssignees.map(([, count]) => count);

  const data = {
    labels,
    datasets: [
      {
        label: 'Tasks Count',
        data: dataCounts,
        backgroundColor: '#8b5cf6', // accent.purple
        borderColor: '#8b5cf6', // accent.purple
        borderWidth: 1,
        borderRadius: 4,
        barThickness: isFullscreen ? (labels.length > 10 ? 15 : 20) : 12,
      },
    ],
  };

  const textColor = getTextColor();
  const gridColor = getGridColor();

  const options = {
    indexAxis: 'y', // Horizontal bar chart
    responsive: true,
    maintainAspectRatio: false,
    categoryPercentage: 0.8,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Tasks by Assignee',
        align: 'center',
        font: {
          family: 'Inter, system-ui, sans-serif',
          size: isFullscreen ? 22 : 18,
          weight: '600',
        },
        color: textColor,
        padding: {
          top: isFullscreen ? 20 : 15,
          bottom: isFullscreen ? 20 : 15,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleFont: {
          family: 'Inter, system-ui, sans-serif',
          size: isFullscreen ? 15 : 13,
          weight: 'bold',
        },
        bodyFont: {
          family: 'Inter, system-ui, sans-serif',
          size: isFullscreen ? 14 : 12,
        },
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        padding: isFullscreen ? 12 : 10,
        cornerRadius: 6,
        displayColors: false,
        callbacks: {
          label: function(context) {
            return ` Tasks: ${context.parsed.x}`;
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          precision: 0,
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: isFullscreen ? 13 : 11,
          },
          color: textColor,
        },
        grid: {
          display: true,
          color: gridColor,
          drawBorder: false,
        },
        title: {
          display: isFullscreen,
          text: 'Number of Tasks',
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: isFullscreen ? 15 : 13,
            weight: '500',
          },
          color: textColor,
        },
      },
      y: {
        ticks: {
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: isFullscreen ? (labels.length > 10 ? 11 : 12) : 10,
          },
          color: textColor,
          autoSkip: !isFullscreen,
          maxRotation: 0,
        },
        grid: {
          display: false,
        },
      }
    },
    elements: {
      bar: {
        borderSkipped: 'start',
      }
    },
  };
  
  const containerClass = isFullscreen
    ? "w-full h-full bg-white dark:bg-customGray-800"
    : "bg-white dark:bg-customGray-800 p-4 rounded-xl shadow-lg h-96 cursor-pointer";

  const chartRef = React.useRef(null);
  React.useEffect(() => {
    const chart = chartRef.current;
    if (chart) {
      const newTextColor = getTextColor();
      const newGridColor = getGridColor();
      chart.options.plugins.title.color = newTextColor;
      chart.options.scales.x.ticks.color = newTextColor;
      if (chart.options.scales.x.title) chart.options.scales.x.title.color = newTextColor;
      chart.options.scales.y.ticks.color = newTextColor;
      chart.options.scales.x.grid.color = newGridColor;
      chart.update('none');
    }
  }, [isFullscreen]); // Re-run if isFullscreen changes to apply styles

  return (
    <div
      id="tasks-by-assignee-chart"
      data-title="Tasks by Assignee"
      className={containerClass}
      onClick={!isFullscreen ? onClick : undefined}
    >
      <Bar ref={chartRef} data={data} options={options} />
    </div>
  );
}