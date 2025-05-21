import React, { useEffect, useRef } from 'react'; // Added useEffect, useRef
import { Bar } from 'react-chartjs-2';
// ChartJS and scales already registered in other files, but safe to include if this were standalone.

// Helper to determine text color based on dark mode
const getTextColor = () => {
  if (typeof window !== 'undefined' && document.documentElement.classList.contains('dark')) {
    return '#e5e7eb'; // customGray.200
  }
  return '#374151'; // customGray.700
};

// Helper to determine grid color based on dark mode
const getGridColor = () => {
  if (typeof window !== 'undefined' && document.documentElement.classList.contains('dark')) {
    return 'rgba(75, 85, 99, 0.4)'; // customGray.600 with alpha
  }
  return 'rgba(209, 213, 219, 0.6)'; // customGray.300 with alpha
};


export default function TasksByDeadlineChart({ tasks, onClick, isFullscreen }) { // Added isFullscreen
  if (!tasks || tasks.length === 0) {
    return <div className="text-center text-customGray-500 dark:text-customGray-400 py-10">No task data available for chart.</div>;
  }

  // Current date for comparisons
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Calculate end of this week and month
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
  
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  // Group tasks by deadline periods
  const deadlineGroups = {
    'Overdue': 0,
    'Today': 0,
    'This Week': 0,
    'This Month': 0,
    'Future': 0,
    'No Deadline': 0,
  };
  
  tasks.forEach(task => {
    // Skip completed tasks
    if (task.completed) return;
    
    if (!task.deadline) {
      deadlineGroups['No Deadline']++;
      return;
    }
    
    const deadlineDate = new Date(task.deadline);
    
    // Ensure valid date
    if (isNaN(deadlineDate.getTime())) {
      deadlineGroups['No Deadline']++;
      return;
    }
    
    // Normalize to compare dates only (not time)
    const normalizedDeadline = new Date(
      deadlineDate.getFullYear(), 
      deadlineDate.getMonth(), 
      deadlineDate.getDate()
    );
    
    if (normalizedDeadline < today) {
      deadlineGroups['Overdue']++;
    } else if (normalizedDeadline.getTime() === today.getTime()) {
      deadlineGroups['Today']++;
    } else if (normalizedDeadline <= endOfWeek) {
      deadlineGroups['This Week']++;
    } else if (normalizedDeadline <= endOfMonth) {
      deadlineGroups['This Month']++;
    } else {
      deadlineGroups['Future']++;
    }
  });
  
  // Prepare data for the chart
  const labels = Object.keys(deadlineGroups);
  const counts = Object.values(deadlineGroups);
  
  // Colors for different deadline periods
  // Colors for different deadline periods from tailwind.config.js
  const deadlineColors = {
    'Overdue': '#ef4444',       // error
    'Today': '#facc15',         // warning
    'This Week': '#3b82f6',     // primary.DEFAULT / info
    'This Month': '#22c55e',    // secondary.DEFAULT / success
    'Future': '#8b5cf6',        // accent.purple
    'No Deadline': '#6b7280',   // customGray.500
  };
  
  const backgroundColors = labels.map(label => deadlineColors[label] || '#6b7280');
  const borderColors = backgroundColors; // Use same color for border or make slightly darker if needed

  const data = {
    labels,
    datasets: [
      {
        label: 'Tasks',
        data: counts,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // No legend needed for single dataset bar chart
      },
      title: {
        display: true,
        text: 'Tasks by Deadline (Upcoming/Overdue)',
        align: 'center',
        font: {
          family: 'Inter, system-ui, sans-serif',
          size: isFullscreen ? 22 : 18,
          weight: '600',
        },
        color: getTextColor(),
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
        displayColors: true, // Show color box next to label
        callbacks: {
          label: function(context) {
            return `Tasks: ${context.raw}`;
          }
        }
      }
    },
    scales: {
      x: { // For vertical bar chart, X is category, Y is value
        ticks: {
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: isFullscreen ? 13 : 11,
          },
          color: getTextColor(),
        },
        grid: {
          display: false, // Hide vertical grid lines for cleaner look
        },
      },
      y: { // Value axis
        beginAtZero: true,
        ticks: {
          stepSize: 1, // Ensure integer ticks if counts are always whole numbers
          precision: 0,
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: isFullscreen ? 13 : 11,
          },
          color: getTextColor(),
        },
        grid: {
          display: true,
          color: getGridColor(),
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
            color: getTextColor(),
        },
      }
    },
    elements: {
      bar: {
        borderRadius: 4,
        borderSkipped: 'bottom',
      }
    }
  };
  
  const containerClass = isFullscreen
    ? "w-full h-full bg-white dark:bg-customGray-800"
    : "bg-white dark:bg-customGray-800 p-4 rounded-xl shadow-lg h-96 cursor-pointer";

  const chartRef = useRef(null);
  useEffect(() => {
    const chart = chartRef.current;
    if (chart) {
      const textColor = getTextColor();
      const gridColor = getGridColor();
      chart.options.plugins.title.color = textColor;
      chart.options.scales.x.ticks.color = textColor;
      chart.options.scales.y.ticks.color = textColor;
      if (chart.options.scales.y.title) chart.options.scales.y.title.color = textColor;
      chart.options.scales.y.grid.color = gridColor;
      chart.update('none');
    }
  }, [isFullscreen]); // Re-run if isFullscreen changes

  return (
    <div
      id="tasks-by-deadline-chart"
      data-title="Tasks by Deadline"
      className={containerClass}
      onClick={!isFullscreen ? onClick : undefined}
    >
      <Bar ref={chartRef} data={data} options={options} />
    </div>
  );
}