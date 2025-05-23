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

// Helper for input background in dark mode
const getInputBgColor = () => {
  return document.documentElement.classList.contains('dark') ? '#374151' : '#ffffff'; // customGray.700 or white
};

// Helper for input border in dark mode
const getInputBrColor = () => {
  return document.documentElement.classList.contains('dark') ? '#4b5563' : '#d1d5db'; // customGray.600 or customGray.300
};


export default function TasksByRequesterChart({ tasks, onClick, isFullscreen }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredRequesters, setFilteredRequesters] = useState([]);
  const [allRequesters, setAllRequesters] = useState([]);
  const requestersPerPage = 15;

  // Calculate task counts per requester
  useEffect(() => {
    if (!tasks || tasks.length === 0) return;
    
    const requesterCounts = tasks.reduce((acc, task) => {
      const requester = task.requester || 'N/A';
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
    
    setCurrentPage(1);
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

  const handleDownload = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    const csvContent = 'Requester,Tasks\n' +
      allRequesters.map(([requester, count]) => `"${requester.replace(/"/g, '""')}",${count}`).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'tasks_by_requester.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [allRequesters]);

  if (!tasks || tasks.length === 0) {
    return <div className="text-center text-customGray-500 dark:text-customGray-400 py-10">No task data available for chart.</div>;
  }

  // For normal view, show top requesters only - no "Others" to avoid chart distortion
  const maxItems = isFullscreen ? requestersPerPage : 8;
  
  // Prepare chart data
  let labels = [];
  let dataCounts = [];
  let chartData = [];
  
  if (isFullscreen) {
    // Calculate pagination
    const totalPages = Math.ceil(filteredRequesters.length / requestersPerPage);
    const indexOfLastRequester = currentPage * requestersPerPage;
    const indexOfFirstRequester = indexOfLastRequester - requestersPerPage;
    const currentRequesters = filteredRequesters.slice(indexOfFirstRequester, indexOfLastRequester);
    
    chartData = currentRequesters;
    labels = currentRequesters.map(([requester]) => requester);
    dataCounts = currentRequesters.map(([, count]) => count);
  } else {
    // In normal view, show top requesters only - no "Others" to avoid chart distortion
    const topRequesters = allRequesters.slice(0, maxItems);
    
    chartData = topRequesters;
    labels = chartData.map(([requester]) => requester);
    dataCounts = chartData.map(([, count]) => count);
  }

  const data = {
    labels,
    datasets: [
      {
        label: 'Tasks Count',
        data: dataCounts,
        backgroundColor: '#1f2937', // Dark bars for actual values
        borderWidth: 0, // Remove borders
        borderColor: 'transparent', // Ensure no border color
        borderRadius: 0, // Remove border radius that might cause outlines
        barThickness: isFullscreen ? 18 : 14,
      },
    ],
  };

  const textColor = getTextColor();

  // Chart options optimized for clean design like screenshot
  const options = {
    indexAxis: 'y', // Horizontal bars
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
    transitions: {
      active: {
        animation: {
          duration: 0, // No hover animations
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        display: false, // Hide x-axis for cleaner look
      },
      y: {
        ticks: {
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: isFullscreen ? 14 : 15,
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
      }
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Tasks by Requester',
        align: 'center',
        font: {
          family: 'Inter, system-ui, sans-serif',
          size: isFullscreen ? 24 : 20,
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
    layout: {
      padding: {
        top: isFullscreen ? 15 : 25,
        right: isFullscreen ? 60 : 60, // Space for numbers on the right
        bottom: 15,
        left: isFullscreen ? 15 : 20,
      }
    },
    elements: {
      bar: {
        borderWidth: 0, // Ensure no borders on bar elements
        borderSkipped: false,
      }
    },
  };

  // Register custom plugin for number labels
  const customLabelsPlugin = {
    id: 'customLabels',
    afterDatasetsDraw: (chart) => {
      const ctx = chart.ctx;
      const datasets = chart.data.datasets;
      const meta = chart.getDatasetMeta(0); // Use the first (and only) dataset
      
      meta.data.forEach((bar, index) => {
        const value = datasets[0].data[index]; // Get value from the first dataset
        
        // Position for number to the right of the bar
        const x = bar.x + 8;
        const y = bar.y;
        
        // Draw number
        ctx.fillStyle = textColor;
        ctx.font = `600 ${isFullscreen ? '15px' : '14px'} Inter, system-ui, sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(value.toString(), x, y);
      });
    }
  };

  // Custom container class
  const containerClass = isFullscreen
    ? "w-full h-full flex flex-col bg-white dark:bg-customGray-800"
    : "p-6 h-96 cursor-pointer relative";

  const chartRef = React.useRef(null);
  const inputRef = React.useRef(null);

  // Update chart colors on theme change
  React.useEffect(() => {
    const chart = chartRef.current;
    if (chart) {
      const newTextColor = getTextColor();
      if (chart.options.plugins.title) {
        chart.options.plugins.title.color = newTextColor;
      }
      chart.options.scales.y.ticks.color = newTextColor;
      chart.update('none');
    }
  }, [isFullscreen]);

  // Normal view - simplified chart
  if (!isFullscreen) {
    return (
      <div
        id="tasks-by-requester-chart"
        data-title="Tasks by Requester"
        className={containerClass}
        onClick={onClick}
      >
        <div className="h-full">
          <Bar 
            key={`requester-chart-normal-${allRequesters.length}`}
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
        {allRequesters.length > maxItems && (
          <div className="absolute bottom-2 left-0 right-0 text-center text-xs text-customGray-500 dark:text-customGray-400">
            Showing top {maxItems} of {allRequesters.length} requesters. Click to see all requesters.
          </div>
        )}
      </div>
    );
  }

  // Fullscreen view with search and pagination
  const totalPages = Math.ceil(filteredRequesters.length / requestersPerPage);
  const indexOfLastRequester = currentPage * requestersPerPage;
  const indexOfFirstRequester = indexOfLastRequester - requestersPerPage;
  const currentItemCount = filteredRequesters.length > 0 ? Math.min(indexOfLastRequester, filteredRequesters.length) - indexOfFirstRequester : 0;

  return (
    <div
      id="tasks-by-requester-chart-fullscreen"
      data-title="Tasks by Requester"
      className={containerClass}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="p-6 border-b border-customGray-200 dark:border-customGray-700">
        <h2 className="text-2xl font-semibold text-customGray-900 dark:text-customGray-100 mb-4">Tasks by Requester</h2>
        
        {/* Search */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search requesters..."
              className="w-full p-3 border border-customGray-300 dark:border-customGray-600 rounded-lg bg-white dark:bg-customGray-700 text-customGray-900 dark:text-customGray-100 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              value={searchTerm}
              onChange={handleSearchChange}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="text-sm text-customGray-600 dark:text-customGray-300">
            Showing {currentItemCount} of {filteredRequesters.length} requesters
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 p-6">
        <div style={{ height: `${Math.max(400, currentItemCount * 40)}px` }}>
          <Bar 
            key={`requester-chart-fullscreen-${currentPage}-${filteredRequesters.length}`}
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
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-6 border-t border-customGray-200 dark:border-customGray-700 flex justify-between items-center">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-customGray-700 dark:text-customGray-300">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Download */}
      <div className="p-6 border-t border-customGray-200 dark:border-customGray-700">
        <button
          onClick={handleDownload}
          className="w-full py-3 px-4 rounded-lg text-sm font-medium text-white bg-secondary hover:bg-secondary-dark focus:outline-none focus:ring-2 focus:ring-secondary transition-colors"
        >
          Download All Requester Data (CSV)
        </button>
      </div>
    </div>
  );
}