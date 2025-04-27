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

export default function TasksByAssetChart({ tasks }) {
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
        text: 'Tasks by Asset Type',
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