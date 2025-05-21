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

// Helper to determine text color based on dark mode
const getTextColor = () => {
  if (typeof window !== 'undefined' && document.documentElement.classList.contains('dark')) {
    return '#e5e7eb'; // customGray.200 for dark mode
  }
  return '#374151'; // customGray.700 for light mode
};

// Helper to determine grid color based on dark mode
const getGridColor = () => {
  if (typeof window !== 'undefined' && document.documentElement.classList.contains('dark')) {
    return 'rgba(229, 231, 235, 0.2)'; // customGray.200 with alpha for dark mode grid
  }
  return 'rgba(209, 213, 219, 0.5)'; // customGray.300 with alpha for light mode grid
};


export default function TaskTrendChart({ tasks, onClick, isFullscreen }) {
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
        fill: true, // Enable fill for area chart feel
        borderColor: '#3b82f6', // primary.DEFAULT
        backgroundColor: 'rgba(59, 130, 246, 0.2)', // primary.DEFAULT with alpha
        tension: isFullscreen ? 0.3 : 0.2, // Smoother lines
        borderWidth: isFullscreen ? 2.5 : 1.5,
        pointRadius: isFullscreen ? 5 : 3,
        pointHoverRadius: isFullscreen ? 8 : 5,
        pointBackgroundColor: '#3b82f6',
      },
      {
        label: 'Tasks Completed',
        data: completedCounts,
        fill: true, // Enable fill for area chart feel
        borderColor: '#22c55e', // secondary.DEFAULT
        backgroundColor: 'rgba(34, 197, 94, 0.2)', // secondary.DEFAULT with alpha
        tension: isFullscreen ? 0.3 : 0.2, // Smoother lines
        borderWidth: isFullscreen ? 2.5 : 1.5,
        pointRadius: isFullscreen ? 5 : 3,
        pointHoverRadius: isFullscreen ? 8 : 5,
        pointBackgroundColor: '#22c55e',
      },
    ],
  };

  // Base options for both normal and fullscreen modes
  const textColor = getTextColor();
  const gridColor = getGridColor();
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: isFullscreen ? 'top' : 'bottom',
        labels: {
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: isFullscreen ? 14 : 12
          },
          color: textColor,
          usePointStyle: true,
          boxWidth: isFullscreen ? 10 : 8,
          padding: isFullscreen ? 15 : 10,
        }
      },
      title: {
        display: true,
        text: 'Task Creation & Completion Trend',
        align: 'center',
        font: {
          family: 'Inter, system-ui, sans-serif',
          size: isFullscreen ? 22 : 18,
          weight: '600' // semibold
        },
        color: textColor,
        padding: {
          top: isFullscreen ? 25 : 15,
          bottom: isFullscreen ? 25 : 15
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleFont: {
          family: 'Inter, system-ui, sans-serif',
          size: isFullscreen ? 15 : 13,
          weight: 'bold',
        },
        bodyFont: {
          family: 'Inter, system-ui, sans-serif',
          size: isFullscreen ? 14 : 12
        },
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        padding: isFullscreen ? 14 : 10,
        cornerRadius: 6,
        displayColors: true,
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          precision: 0,
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: isFullscreen ? 13 : 11
          },
          color: textColor,
        },
        title: {
          display: isFullscreen,
          text: 'Number of Tasks',
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: isFullscreen ? 15 : 13,
            weight: '500' // medium
          },
          color: textColor,
        },
        grid: {
          display: true,
          color: gridColor,
          drawBorder: false, // Softer look
        }
      },
      x: {
        ticks: {
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: isFullscreen ? 13 : 11
          },
          color: textColor,
          maxRotation: isFullscreen ? 0 : 30 // Less rotation for non-fullscreen
        },
        title: {
          display: true,
          text: 'Month',
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: isFullscreen ? 15 : 13,
            weight: isFullscreen ? '500' : 'normal'
          },
          color: textColor,
        },
        grid: {
          display: isFullscreen, // Only show X grid in fullscreen for cleaner look
          color: gridColor,
          drawBorder: false,
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
    ? "w-full h-full bg-white dark:bg-customGray-800" // Ensure fullscreen modal background matches
    : "bg-white dark:bg-customGray-800 p-4 rounded-xl shadow-lg h-96 cursor-pointer"; // Updated styles

  // Effect to update text/grid color on theme change
  const chartRef = React.useRef(null);
  React.useEffect(() => {
    const chart = chartRef.current;
    if (chart) {
      const newTextColor = getTextColor();
      const newGridColor = getGridColor();
      chart.options.plugins.legend.labels.color = newTextColor;
      chart.options.plugins.title.color = newTextColor;
      chart.options.scales.y.ticks.color = newTextColor;
      chart.options.scales.y.title.color = newTextColor;
      chart.options.scales.x.ticks.color = newTextColor;
      chart.options.scales.x.title.color = newTextColor;
      chart.options.scales.y.grid.color = newGridColor;
      chart.options.scales.x.grid.color = newGridColor;
      chart.update();
    }
  }, []); // Add dependency on dark mode state if available

  return (
    <div
      id="task-trend-chart"
      data-title="Task Creation & Completion Trend"
      className={containerClass}
      onClick={!isFullscreen ? onClick : undefined}
    >
      <Line ref={chartRef} data={data} options={options} />
    </div>
  );
}