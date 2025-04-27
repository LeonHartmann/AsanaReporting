import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title
} from 'chart.js';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  Title
);

export default function CompletionStatusChart({ tasks }) {
  if (!tasks || tasks.length === 0) {
    return <div className="text-center text-gray-500 dark:text-gray-400">No task data available for chart.</div>;
  }

  const completedCount = tasks.filter(task => task.completed).length;
  const incompleteCount = tasks.length - completedCount;
  const totalTasks = tasks.length;

  const data = {
    labels: ['Completed', 'Incomplete'],
    datasets: [
      {
        label: '# of Tasks',
        data: [completedCount, incompleteCount],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)', // Completed color (Teal)
          'rgba(255, 99, 132, 0.6)', // Incomplete color (Red)
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Task Completion Status',
        font: {
          size: 16
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed !== null) {
               const value = context.parsed;
               const percentage = ((value / totalTasks) * 100).toFixed(1);
               label += `${value} (${percentage}%)`;
            }
            return label;
          }
        }
      }
    },
     // Optional: Add center text like the Asana example
     // This requires a custom plugin or careful styling
     // elements: {
     //   center: {
     //     text: totalTasks,
     //     color: '#36A2EB', // Default font color
     //     fontStyle: 'Arial', // Default font
     //     sidePadding: 20 // Default padding
     //   }
     // },
     cutout: '60%', // Adjust for doughnut thickness
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md h-80"> {/* Fixed height container */}
      <Doughnut data={data} options={options} />
    </div>
  );
} 