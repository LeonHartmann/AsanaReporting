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

export default function TasksByBrandChart({ tasks, onClick, isFullscreen }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredBrands, setFilteredBrands] = useState([]);
  const [allBrands, setAllBrands] = useState([]);
  const brandsPerPage = 15; // Reduced from 20 to 15 for better performance

  // Calculate task counts per brand
  useEffect(() => {
    if (!tasks || tasks.length === 0) return;
    
    const brandCounts = tasks.reduce((acc, task) => {
      const brand = task.brand || 'N/A'; // Use 'N/A' if brand is missing
      acc[brand] = (acc[brand] || 0) + 1;
      return acc;
    }, {});

    // Sort brands by task count descending
    const sorted = Object.entries(brandCounts)
      .sort(([, countA], [, countB]) => countB - countA);
    
    setAllBrands(sorted);
    setFilteredBrands(sorted);
  }, [tasks]);

  // Handle search input changes
  const handleSearchChange = useCallback((e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (term.trim() === '') {
      setFilteredBrands(allBrands);
    } else {
      const results = allBrands.filter(([brand]) => 
        brand.toString().toLowerCase().includes(term.toLowerCase())
      );
      setFilteredBrands(results);
    }
    
    setCurrentPage(1); // Reset to first page on search
  }, [allBrands]);

  // Pagination handlers
  const handlePrevPage = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentPage(prev => Math.max(prev - 1, 1));
  }, []);

  const handleNextPage = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const totalPages = Math.ceil(filteredBrands.length / brandsPerPage);
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  }, [filteredBrands.length, brandsPerPage]);
  
  // Handle download
  const handleDownload = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Create CSV content for all brands
    const csvContent = 'Brand,Tasks\n' + 
      allBrands.map(([brand, count]) => `"${brand}",${count}`).join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'brands_tasks.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [allBrands]);

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
    const totalPages = Math.ceil(filteredBrands.length / brandsPerPage);
    const indexOfLastBrand = currentPage * brandsPerPage;
    const indexOfFirstBrand = indexOfLastBrand - brandsPerPage;
    const currentBrands = filteredBrands.slice(indexOfFirstBrand, indexOfLastBrand);
    
    // In fullscreen mode, use paginated/filtered data
    labels = currentBrands.map(([brand]) => brand);
    dataCounts = currentBrands.map(([, count]) => count);
  } else if (allBrands.length > maxItems) {
    // In normal view, use top brands + Others
    const truncatedData = allBrands.slice(0, maxItems);
    labels = truncatedData.map(([brand]) => brand);
    dataCounts = truncatedData.map(([, count]) => count);
    
    // Add "Others" category with the sum of the remaining items
    const othersSum = allBrands.slice(maxItems).reduce((sum, [, count]) => sum + count, 0);
    if (othersSum > 0) {
      labels.push('Others');
      dataCounts.push(othersSum);
    }
  } else {
    // If we have fewer brands than the limit, show all
    labels = allBrands.map(([brand]) => brand);
    dataCounts = allBrands.map(([, count]) => count);
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
        backgroundColor: 'rgba(236, 72, 153, 0.6)', // Pink
        borderColor: 'rgba(236, 72, 153, 1)',
        borderWidth: isFullscreen ? 1 : 1,
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
        align: 'center',
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
    : "bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 px-6 pt-6 pb-8 rounded-xl shadow-lg ring-1 ring-gray-200 dark:ring-gray-700 h-96 cursor-pointer relative flex flex-col transition hover:shadow-xl";

  // If in normal view, render just the chart with a note
  if (!isFullscreen) {
    return (
      <div 
        id="tasks-by-brand-chart"
        data-title="Tasks by Brand"
        className={containerClass}
        onClick={onClick}
      >
        <div className="flex-grow relative">
          <Bar data={data} options={options} />
        </div>
        
        {allBrands.length > maxItems && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
            Showing top {maxItems} of {allBrands.length} brands.
          </div>
        )}
      </div>
    );
  }

  // Calculate pagination stats for display
  const totalPages = Math.ceil(filteredBrands.length / brandsPerPage);
  const indexOfLastBrand = currentPage * brandsPerPage;
  const indexOfFirstBrand = indexOfLastBrand - brandsPerPage;

  // In fullscreen mode, include search and pagination
  return (
    <div 
      id="tasks-by-brand-chart-fullscreen"
      data-title="Tasks by Brand"
      className={containerClass}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Search and info bar */}
      <div className="p-4 border-b flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search brands..."
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            value={searchTerm}
            onChange={handleSearchChange}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-300">
          Total: {allBrands.length} brands | Filtered: {filteredBrands.length} brands
        </div>
      </div>
      
      {/* Chart */}
      <div className="flex-1 overflow-hidden relative">
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
            Showing {indexOfFirstBrand + 1}-{Math.min(indexOfLastBrand, filteredBrands.length)} of {filteredBrands.length} brands
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
          Download Brand Data (CSV)
        </button>
      </div>
    </div>
  );
} 