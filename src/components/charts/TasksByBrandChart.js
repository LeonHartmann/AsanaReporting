import React, { useState, useEffect } from 'react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredBrands, setFilteredBrands] = useState([]);
  const brandsPerPage = 15; // Reduced from 20 to 15 for better performance

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

  // Handle search/filtering for fullscreen mode
  useEffect(() => {
    if (isFullscreen) {
      const filtered = sortedBrands.filter(([brand]) => 
        brand.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBrands(filtered);
      setCurrentPage(1); // Reset to first page when search changes
    }
  }, [searchTerm, isFullscreen, sortedBrands]);

  // Set up initial filtered brands on mount or when fullscreen changes
  useEffect(() => {
    if (isFullscreen) {
      setFilteredBrands(sortedBrands);
    }
  }, [isFullscreen, sortedBrands]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredBrands.length / brandsPerPage);

  // Get current brands for pagination
  const indexOfLastBrand = currentPage * brandsPerPage;
  const indexOfFirstBrand = indexOfLastBrand - brandsPerPage;
  const currentBrands = filteredBrands.slice(indexOfFirstBrand, indexOfLastBrand);

  // Handle pagination
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  // For normal view, truncate data
  const maxItems = 10;
  const truncatedData = sortedBrands.slice(0, maxItems);
  
  // Prepare chart data
  let labels = [];
  let dataCounts = [];
  
  if (isFullscreen) {
    // In fullscreen mode, use paginated/filtered data
    labels = currentBrands.map(([brand]) => brand);
    dataCounts = currentBrands.map(([, count]) => count);
  } else if (sortedBrands.length > maxItems) {
    // In normal view, use top brands + Others
    labels = truncatedData.map(([brand]) => brand);
    dataCounts = truncatedData.map(([, count]) => count);
    
    // Add "Others" category with the sum of the remaining items
    const othersSum = sortedBrands.slice(maxItems).reduce((sum, [, count]) => sum + count, 0);
    if (othersSum > 0) {
      labels.push('Others');
      dataCounts.push(othersSum);
    }
  } else {
    // If we have fewer brands than the limit, show all
    labels = sortedBrands.map(([brand]) => brand);
    dataCounts = sortedBrands.map(([, count]) => count);
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
    },
    // Add performance optimizations
    elements: {
      bar: {
        borderWidth: isFullscreen ? 1 : 1, // Reduce border width for performance
      }
    },
    devicePixelRatio: 1.5, // Optimize for performance
  };

  // Additional options for fullscreen mode
  const fullscreenOptions = isFullscreen ? {
    layout: {
      padding: {
        top: 10,
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
    ? "w-full h-full flex flex-col"
    : "bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md h-96 cursor-pointer";

  // If in normal view, render just the chart with a note
  if (!isFullscreen) {
    return (
      <div 
        id="tasks-by-brand-chart"
        data-title="Tasks by Brand"
        className={containerClass}
        onClick={onClick}
      >
        <Bar data={data} options={options} />
        
        {sortedBrands.length > maxItems && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            Showing top {maxItems} of {sortedBrands.length} brands. Click to view all.
          </div>
        )}
      </div>
    );
  }

  // In fullscreen mode, include search and pagination
  return (
    <div 
      id="tasks-by-brand-chart-fullscreen"
      data-title="Tasks by Brand"
      className={containerClass}
      onClick={(e) => e.stopPropagation()} // Prevent the modal from closing when clicking inside
    >
      {/* Search and info bar */}
      <div className="p-4 border-b flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search brands..."
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-300">
          Total: {sortedBrands.length} brands | Filtered: {filteredBrands.length} brands
        </div>
      </div>
      
      {/* Chart */}
      <div className="flex-1 overflow-hidden">
        <Bar data={data} options={options} />
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-3 border-t flex justify-between items-center">
          <button 
            onClick={prevPage} 
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded ${currentPage === 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
          >
            Previous
          </button>
          
          <div className="text-sm">
            Page {currentPage} of {totalPages} | 
            Showing {indexOfFirstBrand + 1}-{Math.min(indexOfLastBrand, filteredBrands.length)} of {filteredBrands.length} brands
          </div>
          
          <button 
            onClick={nextPage} 
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
          onClick={(e) => {
            e.stopPropagation();
            // Create CSV content for all brands
            const csvContent = 'Brand,Tasks\n' + 
              sortedBrands.map(([brand, count]) => `"${brand}",${count}`).join('\n');
            
            // Create download link
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', 'brands_tasks.csv');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
          className="w-full py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Download Brand Data (CSV)
        </button>
      </div>
    </div>
  );
} 