import { useState, useEffect, useRef } from 'react';
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
import { formatDuration } from 'date-fns'; // For formatting duration nicely

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Helper to format seconds into a readable string (e.g., "1d 2h 30m")
function formatSeconds(seconds) {
    if (seconds < 60) return `${seconds}s`;
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    let result = '';
    if (days > 0) result += `${days}d `;
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0) result += `${minutes}m`;
    if (result === '') result = `${seconds}s`; // Fallback for < 1 minute

    return result.trim();
}

// Status color mapping (customize as needed)
const statusColors = {
  'Backlog': 'rgba(156, 163, 175, 0.7)', // gray
  'To Do': 'rgba(96, 165, 250, 0.7)',   // blue
  'In Progress': 'rgba(251, 191, 36, 0.7)', // yellow
  'In Review': 'rgba(167, 139, 250, 0.7)', // purple
  'Blocked': 'rgba(248, 113, 113, 0.7)',   // red
  'Done': 'rgba(52, 211, 153, 0.7)',    // green
  // Add more statuses and colors
};

const defaultColor = 'rgba(209, 213, 219, 0.7)'; // default gray

function TaskStatusDurations({ taskId }) {
  const [chartData, setChartData] = useState(null);
  const [taskDetails, setTaskDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!taskId) {
      setIsLoading(false);
      setError('No Task ID provided.');
      setChartData(null);
      setTaskDetails(null);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError('');
      setChartData(null); // Clear previous data
      setTaskDetails(null);

      try {
        const res = await fetch(`/api/task-status-durations?taskId=${taskId}`);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || `Error fetching data: ${res.statusText}`);
        }
        const data = await res.json();
        
        setTaskDetails({
            name: data.taskName,
            brand: data.brand,
            asset: data.asset,
            assignee: data.assignee,
            requester: data.requester,
            taskType: data.taskType
        });

        if (!data.statusDurations || data.statusDurations.length === 0) {
          // Handle case with no duration data (e.g., task just created)
          setError('No status duration history found for this task.');
          setChartData(null);
        } else {
          // Prepare data for Chart.js horizontal stacked bar chart
          const statuses = [...new Set(data.statusDurations.map(d => d.status))]; // Unique statuses in order
          const datasets = statuses.map(status => ({
            label: status,
            data: [data.statusDurations.filter(d => d.status === status).reduce((sum, d) => sum + d.duration, 0)],
            backgroundColor: statusColors[status] || defaultColor,
            borderColor: (statusColors[status] || defaultColor).replace('0.7', '1'), // Darker border
            borderWidth: 1,
          }));

          setChartData({
            labels: ['Duration'], // Single bar representing the task timeline
            datasets: datasets,
          });
        }

      } catch (err) {
        console.error("Failed to fetch or process task status durations:", err);
        setError(err.message || 'Could not load status durations.');
        setChartData(null);
        setTaskDetails(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [taskId]); // Refetch when taskId changes

  if (isLoading) {
    return <div className="text-center p-4">Loading status history...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-600">Error: {error}</div>;
  }

  if (!chartData) {
    // This case might be hit if there's history but no *durations* (e.g., only one status entry)
    return (
        <div className="p-4 border rounded-lg shadow-sm bg-white dark:bg-gray-800">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Task Status History</h3>
            {taskDetails && <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Task: {taskDetails.name}</p>}
            <p className="text-gray-700 dark:text-gray-300">Insufficient data to display status durations.</p>
        </div>
    );
  }

  const options = {
    indexAxis: 'y', // Make it horizontal
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        stacked: true,
        title: {
          display: true,
          text: 'Duration (seconds)',
        },
        ticks: {
           callback: function(value, index, values) {
                // Optionally format ticks further if needed
                return value; 
           }
        }
      },
      y: {
        stacked: true,
        display: false, // Hide the Y-axis label ('Duration')
      },
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false, // Title is handled outside the chart
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.x !== null) {
              // Format the duration in seconds nicely
              label += formatSeconds(context.parsed.x);
            }
            return label;
          }
        }
      }
    },
  };

  return (
    <div className="p-4 border rounded-lg shadow-sm bg-white dark:bg-gray-800">
      <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Task Status Duration Breakdown</h3>
      {taskDetails && (
        <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
          <p><strong>Task:</strong> {taskDetails.name || 'N/A'}</p>
          {/* Add other details if needed */}
          {/* <p>Brand: {taskDetails.brand || 'N/A'}</p> */}
          {/* <p>Assignee: {taskDetails.assignee || 'N/A'}</p> */} 
        </div>
      )}
      <div style={{ height: '100px' }}> {/* Adjust height as needed */} 
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}

export default TaskStatusDurations; 