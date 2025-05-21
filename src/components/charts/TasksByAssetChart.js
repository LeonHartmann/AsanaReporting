import React, { useState, useEffect, useCallback } from 'react';
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
    return 'rgba(75, 85, 99, 0.4)'; // customGray.600 with alpha for dark mode grid (darker than text)
  }
  return 'rgba(209, 213, 219, 0.6)'; // customGray.300 with alpha for light mode grid
};

// Helper for input background in dark mode
const getInputBgColor = () => {
  return document.documentElement.classList.contains('dark') ? '#374151' : '#ffffff'; // customGray.700 or white
};

// Helper for input border in dark mode
const getInputBrColor = () => {
  return document.documentElement.classList.contains('dark') ? '#4b5563' : '#d1d5db'; // customGray.600 or customGray.300
};


export default function TasksByAssetChart({ tasks, onClick, isFullscreen }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [allAssets, setAllAssets] = useState([]);
  const assetsPerPage = 15; // Show 15 assets per page in fullscreen

  // Calculate counts per asset, handling multi-select
  useEffect(() => {
    if (!tasks || tasks.length === 0) return;

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
    const sorted = Object.entries(assetCounts)
      .sort(([, countA], [, countB]) => countB - countA);
    
    setAllAssets(sorted);
    setFilteredAssets(sorted);
    setCurrentPage(1); // Reset page on task data change

  }, [tasks]);

  // Handle search input changes
  const handleSearchChange = useCallback((e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (term.trim() === '') {
      setFilteredAssets(allAssets);
    } else {
      const results = allAssets.filter(([asset]) => 
        asset.toString().toLowerCase().includes(term.toLowerCase())
      );
      setFilteredAssets(results);
    }
    
    setCurrentPage(1); // Reset to first page on search
  }, [allAssets]);

  // Pagination handlers
  const handlePrevPage = useCallback((e) => {
    e.preventDefault(); // Prevent default link behavior
    e.stopPropagation(); // Prevent chart click-through if buttons are inside clickable area
    setCurrentPage(prev => Math.max(prev - 1, 1));
  }, []);

  const handleNextPage = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const totalPages = Math.ceil(filteredAssets.length / assetsPerPage);
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  }, [filteredAssets.length, assetsPerPage]);

  const handleDownload = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    const csvContent = 'Asset Type,Tasks\n' +
      allAssets.map(([asset, count]) => `"${asset.replace(/"/g, '""')}",${count}`).join('\n'); // Handle quotes in asset names

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'tasks_by_asset.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Clean up
  }, [allAssets]);


  if (!tasks || tasks.length === 0) {
    return <div className="text-center text-customGray-500 dark:text-customGray-400 py-10">No task data available for chart.</div>;
  }

  // For normal view, truncate data
  const maxItems = 10;
  
  // Prepare chart data
  let labels = [];
  let dataCounts = [];
  
  if (isFullscreen) {
    // Calculate pagination
    const totalPages = Math.ceil(filteredAssets.length / assetsPerPage);
    const indexOfLastAsset = currentPage * assetsPerPage;
    const indexOfFirstAsset = indexOfLastAsset - assetsPerPage;
    const currentAssets = filteredAssets.slice(indexOfFirstAsset, indexOfLastAsset);
    
    // In fullscreen mode, use paginated/filtered data
    labels = currentAssets.map(([asset]) => asset);
    dataCounts = currentAssets.map(([, count]) => count);
  } else if (allAssets.length > maxItems) {
    // In normal view, use top assets + Others
    const truncatedData = allAssets.slice(0, maxItems);
    labels = truncatedData.map(([asset]) => asset);
    dataCounts = truncatedData.map(([, count]) => count);
    
    // Add "Others" category with the sum of the remaining items
    const othersSum = allAssets.slice(maxItems).reduce((sum, [, count]) => sum + count, 0);
    if (othersSum > 0) {
      labels.push('Others');
      dataCounts.push(othersSum);
    }
  } else {
    // If we have fewer assets than the limit, show all
    labels = allAssets.map(([asset]) => asset);
    dataCounts = allAssets.map(([, count]) => count);
  }

  const data = {
    labels,
    datasets: [
      {
        label: 'Tasks Count',
        data: dataCounts,
        backgroundColor: '#f97316', // accent.orange
        borderColor: '#f97316', // accent.orange
        borderWidth: 1,
        borderRadius: 4, // Add some rounding to bars
        barThickness: isFullscreen ? (labels.length > 10 ? 15 : 20) : 12, // Dynamic thickness
      },
    ],
  };
  
  const textColor = getTextColor();
  const gridColor = getGridColor();

  // Base options for both normal and fullscreen modes
  const baseOptions = {
    indexAxis: 'y', // Horizontal bar chart
    responsive: true,
    maintainAspectRatio: false,
    // barPercentage: barPercentHeight, // Using barThickness instead for more control
    categoryPercentage: 0.8, // Space between bars
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Tasks by Asset Type',
        align: 'center',
        font: {
          family: 'Inter, system-ui, sans-serif',
          size: isFullscreen ? 22 : 18,
          weight: '600', // semibold
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
        displayColors: false, // No color box for single dataset
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
          stepSize: 1, // Ensure integer ticks
          precision: 0,
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: isFullscreen ? 13 : 11,
          },
          color: textColor,
        },
        grid: {
          display: true, // Show X grid lines
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
            size: isFullscreen ? (labels.length > 10 ? 11 : 12) : 10, // Smaller font if many items
          },
          color: textColor,
          // Auto-skip ticks if too many for better readability in normal view
          autoSkip: !isFullscreen, 
          maxRotation: 0,
        },
        grid: {
          display: false, // Hide Y grid lines for horizontal bar
        },
      }
    },
    elements: {
      bar: {
        borderSkipped: 'start', // Rounded corners on one side
      }
    },
    // Removed devicePixelRatio for now, test performance impact later if needed
  };

  // Additional options for fullscreen mode
  const fullscreenOptions = isFullscreen ? {
    layout: {
      padding: {
        top: 10, // Adjusted padding
        right: 30,
        bottom: 10,
        left: 20
      }
    },
    animation: false, // Disable animations in fullscreen mode for better performance
    responsiveAnimationDuration: 0,
  } : {};

  // Merge options
  const options = {
    ...baseOptions,
    ...fullscreenOptions
  };

  // Custom container class based on fullscreen state
  const containerClass = isFullscreen
    ? "w-full h-full flex flex-col bg-white dark:bg-customGray-800 text-customGray-900 dark:text-customGray-100"
    : "bg-white dark:bg-customGray-800 p-4 rounded-xl shadow-lg h-96 cursor-pointer relative flex flex-col text-customGray-900 dark:text-customGray-100"; // Updated styles

  // Effect to update chart text/grid colors on theme change
  const chartRef = React.useRef(null);
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    const chart = chartRef.current;
    if (chart) {
      const newTextColor = getTextColor();
      const newGridColor = getGridColor();
      chart.options.plugins.title.color = newTextColor;
      chart.options.scales.x.ticks.color = newTextColor;
      chart.options.scales.x.title.color = newTextColor; // If title is shown
      chart.options.scales.y.ticks.color = newTextColor;
      chart.options.scales.x.grid.color = newGridColor;
      // chart.options.scales.y.grid.color = newGridColor; // Y grid is hidden, but if shown
      chart.update('none'); // 'none' for no animation
    }
    // Update input styles if needed (alternative to dynamic class)
    if (inputRef.current) {
        inputRef.current.style.backgroundColor = getInputBgColor();
        inputRef.current.style.borderColor = getInputBrColor();
    }
  }, []); // Add dependency on dark mode state if available globally


  // If in normal view, render just the chart with a note
  if (!isFullscreen) {
    return (
      <div
        id="tasks-by-asset-chart"
        data-title="Tasks by Asset Type"
        className={containerClass}
        onClick={onClick}
      >
        <div className="flex-grow relative h-[calc(100%-20px)]"> {/* Adjust height to make space for note */}
          <Bar ref={chartRef} data={data} options={options} />
        </div>
        {allAssets.length > maxItems && (
          <div className="text-xs text-customGray-500 dark:text-customGray-400 mt-1 text-center absolute bottom-2 left-0 right-0">
            Showing top {maxItems} of {allAssets.length}. Click to see all.
          </div>
        )}
      </div>
    );
  }

  // Calculate pagination stats for display
  const totalPages = Math.ceil(filteredAssets.length / assetsPerPage);
  const indexOfLastAsset = currentPage * assetsPerPage;
  const indexOfFirstAsset = indexOfLastAsset - assetsPerPage;
  const currentItemCount = filteredAssets.length > 0 ? Math.min(indexOfLastAsset, filteredAssets.length) - indexOfFirstAsset : 0;


  // In fullscreen mode, include search and pagination
  return (
    <div
      id="tasks-by-asset-chart-fullscreen"
      data-title="Tasks by Asset Type"
      className={containerClass} // Fullscreen uses this class
      onClick={(e) => e.stopPropagation()}
    >
      {/* Search and info bar */}
      <div className="p-4 border-b border-customGray-200 dark:border-customGray-700 flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-[250px] sm:min-w-[300px]">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search asset types..."
            className="w-full p-2.5 border border-customGray-300 dark:border-customGray-600 rounded-lg bg-white dark:bg-customGray-700 text-customGray-900 dark:text-customGray-100 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors"
            value={searchTerm}
            onChange={handleSearchChange}
            onClick={(e) => e.stopPropagation()} // Prevent chart click if modal is open
          />
        </div>
        <div className="text-sm text-customGray-600 dark:text-customGray-300 whitespace-nowrap">
          Total: {allAssets.length} | Filtered: {filteredAssets.length}
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 overflow-auto relative p-2"> {/* Added padding and overflow-auto for safety */}
        <div style={{ height: `${Math.max(300, currentItemCount * 30)}px`, minHeight: '300px' }}> {/* Dynamic height */}
             <Bar ref={chartRef} data={data} options={options} />
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-customGray-200 dark:border-customGray-700 flex justify-between items-center gap-2">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-md text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <div className="text-sm text-customGray-700 dark:text-customGray-300">
            Page {currentPage} of {totalPages}
          </div>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-md text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Download button */}
      <div className="p-4 border-t border-customGray-200 dark:border-customGray-700">
        <button
          onClick={handleDownload}
          className="w-full py-2.5 px-4 rounded-md text-sm font-medium text-white bg-secondary hover:bg-secondary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-light transition-colors"
        >
          Download All Asset Data (CSV)
        </button>
      </div>
    </div>
  );
}