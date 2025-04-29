import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale, // Import TimeScale for time-based x-axis
  TimeSeriesScale // Import TimeSeriesScale for time series data
} from 'chart.js';
import 'chartjs-adapter-date-fns'; // Import the date adapter
import { format } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,      // Register TimeScale
  TimeSeriesScale // Register TimeSeriesScale
);

export default function ProjectActivityChart({ activityData, onClick, isFullscreen }) {
  if (!activityData || activityData.length === 0) {
    return <div className="text-center text-gray-500 dark:text-gray-400">No activity data available.</div>;
  }

  const labels = activityData.map(item => item.date); // Expecting 'YYYY-MM-DD'
  const counts = activityData.map(item => item.count);

  const data = {
    labels,
    datasets: [
      {
        label: 'Weekly Activities',
        data: counts,
        fill: true, // Add fill
        borderColor: 'rgb(139, 92, 246)', // Violet
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        tension: 0.2, // Slightly smoother curve
        borderWidth: isFullscreen ? 2 : 1.5,
        pointRadius: isFullscreen ? 4 : 2,
        pointHoverRadius: isFullscreen ? 6 : 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Keep it clean, title is enough
      },
      title: {
        display: true,
        text: isFullscreen ? 'Project Activity Trend (Weekly)' : '', // Only show title fullscreen
        align: 'center',
        font: {
          size: isFullscreen ? 24 : 16,
          weight: 'bold'
        },
        padding: {
          top: isFullscreen ? 20 : 0,
          bottom: isFullscreen ? 20 : 5
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
            // Format tooltip title to be more readable
            title: function(tooltipItems) {
                // Assuming the label is 'YYYY-MM-DD'
                const date = new Date(tooltipItems[0].label);
                return format(date, 'MMM d, yyyy');
            }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          font: {
            size: isFullscreen ? 12 : 10
          }
        },
        title: {
          display: isFullscreen,
          text: 'Activity Count',
          font: {
            size: isFullscreen ? 14 : 12
          }
        },
        grid: {
          display: true,
          color: 'rgba(200, 200, 200, 0.1)'
        }
      },
      x: {
        type: 'time',
        time: {
          unit: 'week',
          tooltipFormat: 'MMM d, yyyy', // Format for tooltips
          displayFormats: {
            week: 'MMM d' // Display format on the axis
          }
        },
        ticks: {
          font: {
            size: isFullscreen ? 12 : 10
          },
          maxRotation: isFullscreen ? 0 : 30,
          autoSkip: true, // Improve label density
          maxTicksLimit: isFullscreen ? 15 : 8 // Limit number of ticks shown
        },
        title: {
          display: isFullscreen,
          text: 'Week Starting',
          font: {
            size: isFullscreen ? 14 : 12
          }
        },
        grid: {
          display: false // Cleaner look for time axis
        }
      }
    }
  };

  const containerClass = isFullscreen
    ? "w-full h-full"
    : "bg-white dark:bg-gray-800 p-2 rounded-lg shadow-md h-64 md:h-full cursor-pointer"; // Adjust height as needed

  return (
    <div
      id="project-activity-chart"
      data-title="Project Activity Trend (Weekly)"
      className={containerClass}
      onClick={onClick} // Allow opening in modal if needed
    >
      <Line data={data} options={options} />
    </div>
  );
} 