import React from 'react';
import { Bar } from 'react-chartjs-2';

export default function TasksByDeadlineChart({ tasks, onClick }) {
  if (!tasks || tasks.length === 0) {
    return <div className="text-center text-gray-500 dark:text-gray-400">No task data available for chart.</div>;
  }

  // Current date for comparisons
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Calculate end of this week and month
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
  
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  // Group tasks by deadline periods
  const deadlineGroups = {
    'Overdue': 0,
    'Today': 0,
    'This Week': 0,
    'This Month': 0,
    'Future': 0,
    'No Deadline': 0,
  };
  
  tasks.forEach(task => {
    // Skip completed tasks
    if (task.completed) return;
    
    if (!task.deadline) {
      deadlineGroups['No Deadline']++;
      return;
    }
    
    const deadlineDate = new Date(task.deadline);
    
    // Ensure valid date
    if (isNaN(deadlineDate.getTime())) {
      deadlineGroups['No Deadline']++;
      return;
    }
    
    // Normalize to compare dates only (not time)
    const normalizedDeadline = new Date(
      deadlineDate.getFullYear(), 
      deadlineDate.getMonth(), 
      deadlineDate.getDate()
    );
    
    if (normalizedDeadline < today) {
      deadlineGroups['Overdue']++;
    } else if (normalizedDeadline.getTime() === today.getTime()) {
      deadlineGroups['Today']++;
    } else if (normalizedDeadline <= endOfWeek) {
      deadlineGroups['This Week']++;
    } else if (normalizedDeadline <= endOfMonth) {
      deadlineGroups['This Month']++;
    } else {
      deadlineGroups['Future']++;
    }
  });
  
  // Prepare data for the chart
  const labels = Object.keys(deadlineGroups);
  const counts = Object.values(deadlineGroups);
  
  // Colors for different deadline periods
  const backgroundColors = [
    'rgba(234, 67, 53, 0.7)',   // Red for Overdue
    'rgba(251, 188, 5, 0.7)',   // Yellow for Today
    'rgba(66, 133, 244, 0.7)',  // Blue for This Week
    'rgba(52, 168, 83, 0.7)',   // Green for This Month
    'rgba(170, 107, 228, 0.7)',  // Purple for Future
    'rgba(128, 128, 128, 0.7)',  // Gray for No Deadline
  ];
  
  const borderColors = backgroundColors.map(color => color.replace('0.7', '1'));

  const data = {
    labels,
    datasets: [
      {
        label: 'Tasks',
        data: counts,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
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
        text: 'Tasks by Deadline',
        font: {
          size: 16
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `Tasks: ${context.raw}`;
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
      }
    }
  };

  return (
    <div 
      id="tasks-by-deadline-chart"
      data-title="Tasks by Deadline"
      className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md h-96 cursor-pointer" 
      onClick={onClick}
    >
      <Bar data={data} options={options} />
    </div>
  );
} 