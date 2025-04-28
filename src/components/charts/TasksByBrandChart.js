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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function TasksByBrandChart({ tasks, onClick, isFullscreen }) {
  if (!tasks || tasks.length === 0) {
    return <div className="text-center text-gray-500 dark:text-gray-400">No task data available for chart.</div>;
  }

  // Calculate task counts per brand
  const brandCounts = tasks.reduce((acc, task) => {
    const brand = task.brand || 'N/A'; // Use 'N/A' if brand is missing
    acc[brand] = (acc[brand] || 0) + 1;
    return acc;
  }, {});

  // Sort brands by task count descending
  const sortedBrands = Object.entries(brandCounts)
    .sort(([, countA], [, countB]) => countB - countA);

  // Limit the number of items in normal view but show more in fullscreen
  const maxItems = isFullscreen ? 30 : 10;
  const truncatedData = sortedBrands.slice(0, maxItems);
  
  // If we truncated the data and we're not in fullscreen, add an "Others" category
  let labels = [];
  let dataCounts = [];
  
  if (!isFullscreen && sortedBrands.length > maxItems) {
    // Get the top items
    labels = truncatedData.map(([brand]) => brand);
    dataCounts = truncatedData.map(([, count]) => count);
    
    // Add "Others" category with the sum of the remaining items
    const othersSum = sortedBrands.slice(maxItems).reduce((sum, [, count]) => sum + count, 0);
    if (othersSum > 0) {
      labels.push('Others');
      dataCounts.push(othersSum);
    }
  } else {
    // Use all data if in fullscreen mode or if we have fewer items than the limit
    labels = truncatedData.map(([brand]) => brand);
    dataCounts = truncatedData.map(([, count]) => count);
  }
  
  // In fullscreen mode, auto-adjust bar height based on number of items
  const barPercentHeight = isFullscreen 
    ? Math.max(0.6, Math.min(0.9, 10 / labels.length))
    : 0.9;

  const data = {
    labels,
    datasets: [
      {
        label: 'Tasks Count',
        data: dataCounts,
        backgroundColor: 'rgba(54, 162, 235, 0.6)', // Blue color
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: isFullscreen ? 2 : 1,
      },
    ],
  };

  // Base options for both normal and fullscreen modes
  const baseOptions = {
    indexAxis: 'y', // Horizontal bar chart
    responsive: true,
    maintainAspectRatio: false,
    barPercentage: barPercentHeight,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Tasks by Brand',
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
            size: isFullscreen ? 14 : 12
          }
        },
        grid: {
          display: isFullscreen
        }
      },
      y: {
        ticks: {
          font: {
            size: isFullscreen ? 14 : 12
          }
        }
      }
    }
  };

  // Additional options for fullscreen mode
  const fullscreenOptions = isFullscreen ? {
    layout: {
      padding: {
        top: 10,
        right: 30, // More padding on the right for values
        bottom: 10,
        left: 20  // More padding on the left for labels
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
      id="tasks-by-brand-chart"
      data-title="Tasks by Brand"
      className={containerClass}
      onClick={onClick}
    >
      <Bar data={data} options={options} />
      
      {/* Show a note about truncated data in normal view */}
      {!isFullscreen && sortedBrands.length > maxItems && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          Showing top {maxItems} of {sortedBrands.length} brands. Click to view all.
        </div>
      )}
    </div>
  );
} 