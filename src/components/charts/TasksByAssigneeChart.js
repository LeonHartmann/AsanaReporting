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

// ChartJS registration is already done in other chart files, 
// but it's safe to include here too. It won't re-register.
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function TasksByAssigneeChart({ tasks }) {
  if (!tasks || tasks.length === 0) {
    return <div className="text-center text-gray-500 dark:text-gray-400">No task data available for chart.</div>;
  }

  // Calculate task counts per assignee
  const assigneeCounts = tasks.reduce((acc, task) => {
    // Use 'Unassigned' if task.assignee is null/undefined or if name is missing
    const assignee = task.assignee || 'Unassigned'; 
    acc[assignee] = (acc[assignee] || 0) + 1;
    return acc;
  }, {});

  // Sort assignees by task count descending for better visualization
  const sortedAssignees = Object.entries(assigneeCounts)
    .sort(([, countA], [, countB]) => countB - countA);

  const labels = sortedAssignees.map(([assignee]) => assignee);
  const dataCounts = sortedAssignees.map(([, count]) => count);

  const data = {
    labels,
    datasets: [
      {
        label: 'Tasks Count',
        data: dataCounts,
        backgroundColor: 'rgba(75, 192, 192, 0.6)', // Teal color
        borderColor: 'rgba(75, 192, 192, 1)',
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
        text: 'Tasks by Assignee',
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