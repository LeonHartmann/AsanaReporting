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
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function TaskCreationTrendChart({ tasks }) {
  if (!tasks || tasks.length === 0) {
    return <div className="text-center text-gray-500 dark:text-gray-400">No task data available for chart.</div>;
  }

  // Calculate task counts per month
  const tasksPerMonth = tasks.reduce((acc, task) => {
    if (task.createdAt) {
      try {
        const date = new Date(task.createdAt);
        // Format as 'YYYY-MM' for easy sorting and labeling
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        acc[monthKey] = (acc[monthKey] || 0) + 1;
      } catch (e) {
        console.error(`Invalid date format for task ${task.id}: ${task.createdAt}`);
      }
    }
    return acc;
  }, {});

  // Sort months chronologically
  const sortedMonths = Object.keys(tasksPerMonth).sort();

  const labels = sortedMonths;
  const dataCounts = sortedMonths.map(month => tasksPerMonth[month]);

  const data = {
    labels,
    datasets: [
      {
        label: 'Tasks Created',
        data: dataCounts,
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
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
        text: 'Task Creation Trend by Month',
         font: {
          size: 16
        }
      },
      tooltip: {
        mode: 'index', // Show tooltip for the month
        intersect: false,
        callbacks: {
           label: function(context) {
            return ` Tasks Created: ${context.parsed.y}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { 
            stepSize: 1,
            precision: 0 
        }
      },
      x: {
        title: {
            display: true,
            text: 'Month'
        }
      }
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md h-80"> {/* Fixed height container */}
      <Line data={data} options={options} />
    </div>
  );
} 