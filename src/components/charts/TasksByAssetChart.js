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

export default function TasksByAssetChart({ tasks, onClick, isFullscreen }) {
  if (!tasks || tasks.length === 0) {
    return <div className="text-center text-gray-500 dark:text-gray-400">No task data available for chart.</div>;
  }

  // Calculate counts per asset, handling multi-select
  const assetCounts = tasks.reduce((acc, task) => {
    const assetsString = task.asset || 'N/A'; 
    if (assetsString !== 'N/A') {
        // Split the string by comma and potential space, then trim each asset
        const individualAssets = assetsString.split(',').map(a => a.trim()).filter(a => a); // Filter out empty strings
        individualAssets.forEach(asset => {
            acc[asset] = (acc[asset] || 0) + 1;
        });
    } else {
        // Count tasks explicitly marked as 'N/A' for assets
         acc['N/A'] = (acc['N/A'] || 0) + 1;
    }
    return acc;
  }, {});

  // Sort assets by task count descending
  const sortedAssets = Object.entries(assetCounts)
    .sort(([, countA], [, countB]) => countB - countA);

  const labels = sortedAssets.map(([asset]) => asset);
  const dataCounts = sortedAssets.map(([, count]) => count);

  const data = {
    labels,
    datasets: [
      {
        label: 'Tasks Count',
        data: dataCounts,
        backgroundColor: 'rgba(255, 159, 64, 0.6)', // Orange color
        borderColor: 'rgba(255, 159, 64, 1)',
        borderWidth: isFullscreen ? 2 : 1,
      },
    ],
  };

  // Calculate appropriate bar percentage height based on number of items
  // More items = thinner bars, especially important in fullscreen mode
  const itemCount = labels.length;
  const barPercentHeight = isFullscreen 
    ? Math.max(0.6, Math.min(0.9, 15 / itemCount))
    : 0.9;

  // Base options for both normal and fullscreen modes
  const options = {
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
        text: 'Tasks by Asset Type',
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
          display: isFullscreen,
          color: 'rgba(200, 200, 200, 0.2)'
        }
      },
      y: {
        ticks: {
          font: {
            size: isFullscreen ? 14 : 12
          }
        },
        grid: {
          display: isFullscreen,
          color: 'rgba(200, 200, 200, 0.2)'
        }
      }
    }
  };

  // Additional options for fullscreen mode
  const fullscreenOptions = isFullscreen ? {
    layout: {
      padding: {
        top: 20,
        right: 30, // More padding on the right for values
        bottom: 20,
        left: 20  // More padding on the left for labels
      }
    },
    animation: {
      duration: 500
    }
  } : {};

  // Merge options
  const mergedOptions = {
    ...options,
    ...fullscreenOptions
  };

  // Custom container class based on fullscreen state
  const containerClass = isFullscreen
    ? "w-full h-full" // When in fullscreen, use parent's full dimensions
    : "bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md h-96 cursor-pointer";

  return (
    <div 
      id="tasks-by-asset-chart"
      data-title="Tasks by Asset Type"
      className={containerClass}
      onClick={onClick}
    >
      <Bar data={data} options={mergedOptions} />
    </div>
  );
} 