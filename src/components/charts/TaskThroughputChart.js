import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement, // Import BarElement for Bar chart
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { format, parse } from 'date-fns'; // Need parse to convert 'YYYY-MM' back to Date for formatting

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement, // Register BarElement
  Title,
  Tooltip,
  Legend
);

export default function TaskThroughputChart({ throughputData, onClick, isFullscreen }) {
  if (!throughputData || throughputData.length === 0) {
    return <div className="text-center text-gray-500 dark:text-gray-400">No throughput data available.</div>;
  }

  // Format labels from 'YYYY-MM' to 'MMM yyyy' for display
  const formatMonthLabel = (monthKey) => {
    try {
      // Parse the YYYY-MM string into a Date object
      const date = parse(monthKey, 'yyyy-MM', new Date());
      return format(date, 'MMM yyyy');
    } catch (e) {
      console.warn("Error formatting month label:", monthKey, e);
      return monthKey; // Fallback to original key
    }
  };

  const labels = throughputData.map(item => formatMonthLabel(item.month));
  const counts = throughputData.map(item => item.count);

  const data = {
    labels,
    datasets: [
      {
        label: 'Tasks Completed',
        data: counts,
        backgroundColor: 'rgba(54, 162, 235, 0.6)', // Blue with some transparency
        borderColor: 'rgb(54, 162, 235)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: isFullscreen ? 'Task Throughput (Monthly)' : '',
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
          text: 'Completed Tasks',
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
        ticks: {
          font: {
            size: isFullscreen ? 12 : 10
          },
          maxRotation: isFullscreen ? 0 : 45,
          autoSkip: true,
          maxTicksLimit: isFullscreen ? 12 : 6 // Limit number of month labels
        },
        title: {
          display: isFullscreen,
          text: 'Month',
          font: {
            size: isFullscreen ? 14 : 12
          }
        },
        grid: {
          display: false
        }
      }
    }
  };

  const containerClass = isFullscreen
    ? "w-full h-full"
    : "bg-white dark:bg-gray-800 p-2 rounded-lg shadow-md h-64 md:h-full cursor-pointer"; // Adjust height

  return (
    <div
      id="task-throughput-chart"
      data-title="Task Throughput (Monthly)"
      className={containerClass}
      onClick={onClick} // Allow opening in modal if needed
    >
      <Bar data={data} options={options} />
    </div>
  );
} 