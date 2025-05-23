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


export default function TasksByDeadlineChart({ tasks }) {
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
        borderWidth: 0, // Remove borders
        borderRadius: 3,
        barThickness: 30,
      },
    ],
  };

  const textColor = getTextColor();

  // Register custom plugin for number labels on top of bars
  const customLabelsPlugin = {
    id: 'customLabels',
    afterDatasetsDraw: (chart) => {
      const ctx = chart.ctx;
      const datasets = chart.data.datasets;
      const meta = chart.getDatasetMeta(0);
      
      meta.data.forEach((bar, index) => {
        const value = datasets[0].data[index];
        
        // Position for number on top of the bar
        const x = bar.x;
        const y = bar.y - 8;
        
        // Draw number
        ctx.fillStyle = textColor;
        ctx.font = `600 14px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(value.toString(), x, y);
      });
    }
  };

  const options = {
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
        display: false,
      },
      title: {
        display: true,
        text: 'Tasks by Deadline (Upcoming/Overdue)',
        align: 'center',
        font: {
          family: 'Inter, system-ui, sans-serif',
          size: 20,
          weight: '600',
        },
        color: textColor,
        padding: {
          top: 0,
          bottom: 25,
        }
      },
      tooltip: {
        enabled: false, // Disable tooltips completely
      }
    },
    scales: {
      x: {
        ticks: {
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 13,
            weight: '500',
          },
          color: textColor,
          padding: 12,
        },
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
      },
      y: {
        display: false, // Hide y-axis for cleaner look
      }
    },
    layout: {
      padding: {
        top: 25,
        right: 20,
        bottom: 15,
        left: 20,
      }
    },
    elements: {
      bar: {
        borderWidth: 0, // Ensure no borders on bar elements
        borderSkipped: false,
      }
    },
  };

  // Custom container class
  const containerClass = "p-6 h-96";

  const chartRef = useRef(null);
  
  // Update chart colors on theme change
  useEffect(() => {
    const chart = chartRef.current;
    if (chart) {
      const newTextColor = getTextColor();
      if (chart.options.plugins.title) {
        chart.options.plugins.title.color = newTextColor;
      }
      chart.options.scales.x.ticks.color = newTextColor;
      chart.update('none');
    }
  }, []);

  return (
    <div
      id="tasks-by-deadline-chart"
      data-title="Tasks by Deadline"
      className={containerClass}
    >
      <Bar 
        ref={chartRef} 
        data={data} 
        options={options} 
        plugins={[customLabelsPlugin]}
        style={{
          border: 'none',
          outline: 'none',
          boxShadow: 'none'
        }}
      />
    </div>
  );
}