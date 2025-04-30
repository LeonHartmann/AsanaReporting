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
    if (seconds === undefined || seconds === null) return 'N/A';
    
    // For very small durations (less than a minute)
    if (seconds < 60) {
        return `${Math.round(seconds)}s`;
    }
    
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.round(seconds % 60);

    // Choose appropriate display format based on magnitude
    if (days > 0) {
        // For durations over a day
        if (hours > 0) {
            return `${days}d ${hours}h`;
        }
        return `${days}d`;
    } else if (hours > 0) {
        // For durations over an hour
        if (minutes > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${hours}h`;
    } else if (minutes > 0) {
        // For durations over a minute
        if (remainingSeconds > 0) {
            return `${minutes}m ${remainingSeconds}s`;
        }
        return `${minutes}m`;
    }
    
    // Should never reach here due to the < 60 check above, but just in case
    return `${remainingSeconds}s`;
}

// Status color mapping (customize as needed)
const statusColors = {
  // Use the exact status names from Supabase (including whitespace and emojis)
  '📃 To Do ': 'rgba(96, 165, 250, 0.7)',         // blue
  ' ☕️ Awaiting Info': 'rgba(234, 179, 8, 0.7)',  // yellow
  '🎨 In progress': 'rgba(59, 130, 246, 0.7)',    // darker blue
  '📩 In Review ': 'rgba(167, 139, 250, 0.7)',    // purple
  '🌀 Completed/Feedback': 'rgba(52, 211, 153, 0.7)', // green
  '✅ Completed': 'rgba(34, 197, 94, 0.7)',       // darker green
  '🟢 CLOSED WON': 'rgba(16, 185, 129, 0.7)',     // teal
  '🔴 CLOSED LOST': 'rgba(239, 68, 68, 0.7)',     // red
  // Include fallbacks for status names without emojis
  'To Do': 'rgba(96, 165, 250, 0.7)',
  'Awaiting Info': 'rgba(234, 179, 8, 0.7)',
  'In Progress': 'rgba(59, 130, 246, 0.7)',
  'In Review': 'rgba(167, 139, 250, 0.7)',
  'Completed/Feedback': 'rgba(52, 211, 153, 0.7)',
  'Completed': 'rgba(34, 197, 94, 0.7)',
  'CLOSED WON': 'rgba(16, 185, 129, 0.7)',
  'CLOSED LOST': 'rgba(239, 68, 68, 0.7)',
};

const defaultColor = 'rgba(209, 213, 219, 0.7)'; // default gray

function TaskStatusDurations({ taskId }) {
  const [chartData, setChartData] = useState(null);
  const [taskDetails, setTaskDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [asanaUrl, setAsanaUrl] = useState('');

  useEffect(() => {
    if (!taskId) {
      setIsLoading(false);
      setError('No Task ID provided.');
      setChartData(null);
      setTaskDetails(null);
      setAsanaUrl('');
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError('');
      setChartData(null); // Clear previous data
      setTaskDetails(null);
      setAsanaUrl('');

      try {
        const res = await fetch(`/api/task-status-durations?taskId=${taskId}`);
        
        if (!res.ok) {
          // For error responses, clone the response before reading
          const clonedRes = res.clone();
          
          // Try to parse as JSON first
          let errorMessage;
          try {
            const errorData = await res.json();
            errorMessage = errorData.message || `Error fetching data: ${res.statusText}`;
          } catch (jsonError) {
            // If JSON parsing fails, get the text instead from the cloned response
            try {
              const errorText = await clonedRes.text();
              errorMessage = `Server error (${res.status}): ${errorText.substring(0, 150)}...`;
            } catch (textError) {
              // If all else fails, use a generic error message
              errorMessage = `Server error (${res.status}): Could not read error details`;
            }
          }
          throw new Error(errorMessage);
        }
        
        // Parse the successful response
        let data;
        try {
          data = await res.json();
        } catch (jsonError) {
          throw new Error(`Failed to parse response as JSON: ${jsonError.message}`);
        }
        
        // Save the Asana URL
        if (data.asanaUrl) {
          setAsanaUrl(data.asanaUrl);
        }
        
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
            label: status.trim(), // Trim whitespace for display
            data: [data.statusDurations.filter(d => d.status === status).reduce((sum, d) => sum + d.duration, 0)],
            backgroundColor: statusColors[status] || defaultColor,
            borderColor: (statusColors[status] || defaultColor).replace('0.7', '1'), // Darker border
            borderWidth: 1,
            borderRadius: 4, // Add rounded corners
            barThickness: 25 // Set consistent bar thickness
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
          text: 'Duration',
        },
        ticks: {
           callback: function(value, index, values) {
                // Format duration based on magnitude
                return formatSeconds(value);
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
          <p><strong>Brand:</strong> {taskDetails.brand || 'N/A'}</p>
          <p><strong>Assignee:</strong> {taskDetails.assignee || 'N/A'}</p>
          
          {/* Asana link button */}
          {asanaUrl && (
            <div className="mt-3">
              <a 
                href={asanaUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd" />
                </svg>
                Open in Asana
              </a>
            </div>
          )}
        </div>
      )}
      {/* Calculate an appropriate height based on the number of statuses */}
      <div style={{ 
        height: chartData && chartData.datasets ? 
          `${Math.max(150, chartData.datasets.length * 35)}px` : 
          '150px'
      }}> 
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}

export default TaskStatusDurations; 