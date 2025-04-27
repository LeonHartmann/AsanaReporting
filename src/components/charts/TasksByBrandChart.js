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

export default function TasksByBrandChart({ tasks, onClick }) {
  if (!tasks || tasks.length === 0) {
    return <div className="text-center text-gray-500 dark:text-gray-400">No task data available for chart.</div>;
  }

  // Calculate task counts per brand
  const brandCounts = tasks.reduce((acc, task) => {
    const brand = task.brand || 'N/A'; // Use 'N/A' if brand is missing
    acc[brand] = (acc[brand] || 0) + 1;
    return acc;
  }, {});

  const labels = Object.keys(brandCounts);
  const dataCounts = Object.values(brandCounts);

  const data = {
    labels,
    datasets: [
      {
        label: 'Tasks Count',
        data: dataCounts,
        backgroundColor: 'rgba(54, 162, 235, 0.6)', // Blue color
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    indexAxis: 'y', // Make it a horizontal bar chart for better label readability if many brands
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Hide legend as it's redundant for a single dataset
      },
      title: {
        display: true,
        text: 'Tasks by Brand',
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
         ticks: { // Ensure only whole numbers are shown on the axis
            stepSize: 1,
            precision: 0 
          }
      }
    }
  };

  return (
    <div 
      className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md h-96 cursor-pointer" 
      onClick={onClick}
    >
      <Bar data={data} options={options} />
    </div>
  );
} 