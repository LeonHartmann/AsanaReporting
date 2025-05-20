import React, { useState, useEffect, useCallback } from 'react';
import { Bar } from 'react-chartjs-2';
import { createVerticalGradient } from '@/utils/chartGradients';
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

export default function TasksByRequesterChart({ tasks, onClick, isFullscreen }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredRequesters, setFilteredRequesters] = useState([]);
  const [allRequesters, setAllRequesters] = useState([]);
  const requestersPerPage = 15; // Show 15 requesters per page in fullscreen

  // Calculate task counts per requester
  useEffect(() => {
    if (!tasks || tasks.length === 0) return;
    
    const requesterCounts = tasks.reduce((acc, task) => {
      const requester = task.requester || 'N/A'; // Use 'N/A' if requester is missing
      acc[requester] = (acc[requester] || 0) + 1;
      return acc;
    }, {});

    // Sort requesters by task count descending
    const sorted = Object.entries(requesterCounts)
      .sort(([, countA], [, countB]) => countB - countA);
    
    setAllRequesters(sorted);
    setFilteredRequesters(sorted);
  }, [tasks]);

  // Handle search input changes
  const handleSearchChange = useCallback((e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (term.trim() === '') {
      setFilteredRequesters(allRequesters);
    } else {
      const results = allRequesters.filter(([requester]) => 
        requester.toString().toLowerCase().includes(term.toLowerCase())
      );
      setFilteredRequesters(results);
    }
    
    setCurrentPage(1); // Reset to first page on search
  }, [allRequesters]);

  // Pagination handlers
  const handlePrevPage = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentPage(prev => Math.max(prev - 1, 1));
  }, []);

  const handleNextPage = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const totalPages = Math.ceil(filteredRequesters.length / requestersPerPage);
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  }, [filteredRequesters.length, requestersPerPage]);
  
  // Handle download
  const handleDownload = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Create CSV content for all requesters
    const csvContent = 'Requester,Tasks\n' + 
      allRequesters.map(([requester, count]) => `"${requester}",${count}`).join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'requesters_tasks.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [allRequesters]);

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
    const totalPages = Math.ceil(filteredRequesters.length / requestersPerPage);
    const indexOfLastRequester = currentPage * requestersPerPage;
    const indexOfFirstRequester = indexOfLastRequester - requestersPerPage;
    const currentRequesters = filteredRequesters.slice(indexOfFirstRequester, indexOfLastRequester);
    
    // In fullscreen mode, use paginated/filtered data
    labels = currentRequesters.map(([requester]) => requester);
    dataCounts = currentRequesters.map(([, count]) => count);
  } else if (allRequesters.length > maxItems) {
    // In normal view, use top requesters + Others
    const truncatedData = allRequesters.slice(0, maxItems);
    labels = truncatedData.map(([requester]) => requester);
    dataCounts = truncatedData.map(([, count]) => count);
    
    // Add "Others" category with the sum of the remaining items
    const othersSum = allRequesters.slice(maxItems).reduce((sum, [, count]) => sum + count, 0);
    if (othersSum > 0) {
      labels.push('Others');
      dataCounts.push(othersSum);
    }
  } else {
    // If we have fewer requesters than the limit, show all
    labels = allRequesters.map(([requester]) => requester);
    dataCounts = allRequesters.map(([, count]) => count);
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
        backgroundColor: (ctx) => {
          const { chart, chartArea } = ctx;
          if (!chartArea) return 'rgba(245, 158, 11, 0.6)';
          return createVerticalGradient(
            chart.ctx,
            chartArea,
            'rgba(253, 224, 71, 0.8)',
            'rgba(245, 158, 11, 0.8)'
          );
        },
        borderColor: (ctx) => {
          const { chart, chartArea } = ctx;
          if (!chartArea) return 'rgba(245, 158, 11, 1)';
          return createVerticalGradient(
            chart.ctx,
            chartArea,
            'rgba(253, 224, 71, 1)',
            'rgba(245, 158, 11, 1)'
          );
        },
        borderWidth: 1,
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
        text: 'Tasks by Requester',
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
    : "bg-gradient-to-tr from-white via-gray-100 to-gray-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 px-6 pt-6 pb-8 rounded-2xl shadow-xl ring-1 ring-gray-200 dark:ring-gray-700 h-96 cursor-pointer relative flex flex-col transition hover:shadow-2xl";

  // If in normal view, render just the chart with a note
  if (!isFullscreen) {
    return (
      <div 
        id="tasks-by-requester-chart"
        data-title="Tasks by Requester"
        className={containerClass}
        onClick={onClick}
      >
        <div className="flex-grow relative">
          <Bar data={data} options={options} />
        </div>
        
        {allRequesters.length > maxItems && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
            Showing top {maxItems} of {allRequesters.length} requesters.
          </div>
        )}
      </div>
    );
  }

  // Calculate pagination stats for display
  const totalPages = Math.ceil(filteredRequesters.length / requestersPerPage);
  const indexOfLastRequester = currentPage * requestersPerPage;
  const indexOfFirstRequester = indexOfLastRequester - requestersPerPage;

  // In fullscreen mode, include search and pagination
  return (
    <div 
      id="tasks-by-requester-chart-fullscreen"
      data-title="Tasks by Requester"
      className={containerClass}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Search and info bar */}
      <div className="p-4 border-b flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search requesters..."
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            value={searchTerm}
            onChange={handleSearchChange}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-300">
          Total: {allRequesters.length} requesters | Filtered: {filteredRequesters.length} requesters
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
            Showing {indexOfFirstRequester + 1}-{Math.min(indexOfLastRequester, filteredRequesters.length)} of {filteredRequesters.length} requesters
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
          Download Requester Data (CSV)
        </button>
      </div>
    </div>
  );
} 