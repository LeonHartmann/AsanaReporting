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
    e.preventDefault();
    e.stopPropagation();
    setCurrentPage(prev => Math.max(prev - 1, 1));
  }, []);

  const handleNextPage = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const totalPages = Math.ceil(filteredAssets.length / assetsPerPage);
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  }, [filteredAssets.length, assetsPerPage]);
  
  // Handle download
  const handleDownload = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Create CSV content for all assets
    const csvContent = 'Asset Type,Tasks\n' + 
      allAssets.map(([asset, count]) => `"${asset}",${count}`).join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'assets_tasks.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [allAssets]);

  if (!tasks || tasks.length === 0) {
    return <div className="text-center text-gray-500 dark:text-gray-400">No task data available for chart.</div>;
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
        backgroundColor: 'rgba(255, 159, 64, 0.6)', // Orange color
        borderColor: 'rgba(255, 159, 64, 1)',
        borderWidth: isFullscreen ? 1 : 1, // Consistent border width
      },
    ],
  };

  // Calculate appropriate bar percentage height based on number of items
  const itemCount = labels.length;
  const barPercentHeight = isFullscreen 
    ? Math.max(0.6, Math.min(0.9, 10 / itemCount)) // Adjusted from 15 for consistency
    : 0.9;

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
    },
    // Add performance optimizations
    elements: {
      bar: {
        borderWidth: isFullscreen ? 1 : 1, // Use consistent border width
      }
    },
    devicePixelRatio: 1.5, // Optimize for performance
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
    ? "w-full h-full flex flex-col" // Use flex-col for fullscreen layout
    : "bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md h-96 cursor-pointer";

  // If in normal view, render just the chart with a note
  if (!isFullscreen) {
    return (
      <div 
        id="tasks-by-asset-chart"
        data-title="Tasks by Asset Type"
        className={containerClass}
        onClick={onClick}
      >
        <Bar data={data} options={options} />
        
        {allAssets.length > maxItems && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            Showing top {maxItems} of {allAssets.length} asset types. Click to view all.
          </div>
        )}
      </div>
    );
  }

  // Calculate pagination stats for display
  const totalPages = Math.ceil(filteredAssets.length / assetsPerPage);
  const indexOfLastAsset = currentPage * assetsPerPage;
  const indexOfFirstAsset = indexOfLastAsset - assetsPerPage;

  // In fullscreen mode, include search and pagination
  return (
    <div 
      id="tasks-by-asset-chart-fullscreen"
      data-title="Tasks by Asset Type"
      className={containerClass}
      onClick={(e) => e.stopPropagation()} // Prevent closing fullscreen when clicking inside
    >
      {/* Search and info bar */}
      <div className="p-4 border-b flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search asset types..."
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            value={searchTerm}
            onChange={handleSearchChange}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-300">
          Total: {allAssets.length} types | Filtered: {filteredAssets.length} types
        </div>
      </div>
      
      {/* Chart */}
      <div className="flex-1 overflow-hidden"> {/* Use flex-1 and overflow-hidden for chart area */}
        <Bar data={data} options={options} />
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-3 border-t flex justify-between items-center">
          <button 
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded ${currentPage === 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
          >
            Previous
          </button>
          
          <div className="text-sm">
            Page {currentPage} of {totalPages} | 
            Showing {indexOfFirstAsset + 1}-{Math.min(indexOfLastAsset, filteredAssets.length)} of {filteredAssets.length} types
          </div>
          
          <button 
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded ${currentPage === totalPages ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
          >
            Next
          </button>
        </div>
      )}
      
      {/* Download button */}
      <div className="p-3 border-t">
        <button 
          onClick={handleDownload}
          className="w-full py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Download Asset Data (CSV)
        </button>
      </div>
    </div>
  );
} 