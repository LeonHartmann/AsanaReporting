import React, { useState } from 'react';
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
  const [showAllInFullscreen, setShowAllInFullscreen] = useState(false);

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

  // Determine if we should show all data
  const shouldShowAll = isFullscreen && showAllInFullscreen;
  
  // Limit the number of items in normal view but show more in fullscreen
  const maxItems = shouldShowAll ? sortedBrands.length : (isFullscreen ? 20 : 10);
  const truncatedData = sortedBrands.slice(0, maxItems);
  
  // If we truncated the data and we're not showing all, add an "Others" category
  let labels = [];
  let dataCounts = [];
  
  if (!shouldShowAll && sortedBrands.length > maxItems) {
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
    // Use all data if showing all or if we have fewer items than the limit
    labels = truncatedData.map(([brand]) => brand);
    dataCounts = truncatedData.map(([, count]) => count);
  }
  
  // In fullscreen mode, auto-adjust bar height based on number of items
  const barPercentHeight = isFullscreen 
    ? Math.max(0.5, Math.min(0.9, 15 / labels.length))
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
    indexAxis: 'y', // Make it a horizontal bar chart for better label readability if many brands
    responsive: true,
    maintainAspectRatio: false,
    barPercentage: barPercentHeight,
    categoryPercentage: 0.8,
    plugins: {
      legend: {
        display: false, // Hide legend as it's redundant for a single dataset
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
        ticks: { // Ensure only whole numbers are shown on the axis
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
    ? "w-full h-full flex flex-col"
    : "bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md h-80 cursor-pointer";

  // Handle the "View All" button click
  const handleViewAllClick = (e) => {
    e.stopPropagation(); // Prevent triggering the modal's onClick
    setShowAllInFullscreen(true);
  };

  return (
    <div 
      className={containerClass}
      onClick={onClick}
    >
      <div className={isFullscreen ? "flex-1" : ""}>
        <Bar data={data} options={options} />
      </div>
      
      {/* Show a note about truncated data and a View All button in fullscreen mode */}
      {isFullscreen && !showAllInFullscreen && sortedBrands.length > maxItems && (
        <div className="text-center mt-4 mb-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing top {maxItems} of {sortedBrands.length} brands.
          </p>
          <button
            onClick={handleViewAllClick}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            View All Brands
          </button>
        </div>
      )}

      {/* Show a note about truncated data in normal view */}
      {!isFullscreen && sortedBrands.length > maxItems && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          Showing top {maxItems} of {sortedBrands.length} brands. Click to view more.
        </div>
      )}
      
      {/* Show a reset button if displaying all brands */}
      {isFullscreen && showAllInFullscreen && (
        <div className="text-center mt-4 mb-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowAllInFullscreen(false);
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Show Less
          </button>
        </div>
      )}
    </div>
  );
} 