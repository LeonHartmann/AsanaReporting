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

export default function TasksByRequesterChart({ tasks }) {
  if (!tasks || tasks.length === 0) {
    return <div className="text-center text-gray-500 dark:text-gray-400">No task data available for chart.</div>;
  }

  // Calculate task counts per requester
  const requesterCounts = tasks.reduce((acc, task) => {
    const requester = task.requester || 'N/A'; // Use 'N/A' if requester is missing
    acc[requester] = (acc[requester] || 0) + 1;
    return acc;
  }, {});

  // Sort requesters by task count descending
  const sortedRequesters = Object.entries(requesterCounts)
    .sort(([, countA], [, countB]) => countB - countA);

  const labels = sortedRequesters.map(([requester]) => requester);
  const dataCounts = sortedRequesters.map(([, count]) => count);

  const data = {
    labels,
    datasets: [
      {
        label: 'Tasks Count',
        data: dataCounts,
        backgroundColor: 'rgba(153, 102, 255, 0.6)', // Purple color
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    indexAxis: 'y', // Horizontal bar chart
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, 
      },
      title: {
        display: true,
        text: 'Tasks by Requester',
         font: {
          size: 16
        }
      },
       tooltip: {
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
            precision: 0 
          }
      }
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md h-80"> {/* Fixed height container */}
      <Bar data={data} options={options} />
    </div>
  );
} 