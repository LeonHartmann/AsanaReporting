import { useState, useEffect } from 'react';
import { format } from 'date-fns'; // Import format for date formatting

// Helper to format seconds into a readable string (e.g., "1d 2h 30m")
function formatSeconds(seconds) {
    if (seconds < 0) return 'N/A'; // Handle potential negative averages if data is sparse
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.round(seconds % 60);

    let result = '';
    if (days > 0) result += `${days}d `;
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0) result += `${minutes}m `;
    if (remainingSeconds > 0 && days === 0 && hours === 0 && minutes === 0) result += `${remainingSeconds}s`; // Show seconds only if less than a minute total
    else if (result === '') result = '0s'; // Handle 0 duration

    return result.trim();
}

// Statuses to exclude from the display
const statusesToExclude = ['✅ Completed', '🔴 CLOSED LOST', '🟢 CLOSED WON', '📍 Resources'];

// Define the custom status order - these are the only statuses we want to track
const statusOrder = [
    '📃 To Do',
    '☕️ Awaiting Info',
    '🎨 In progress',
    '📩 In Review',
    '🌀 Completed/Feedback'
];

function AverageTimeInStatus({ tasks = [] }) {
    const [avgDurations, setAvgDurations] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [lastSyncTime, setLastSyncTime] = useState(null);

    // Function to fetch last sync time from server
    const fetchLastSyncTime = async () => {
        try {
            const res = await fetch('/api/last-sync-time');
            const data = await res.json();
            if (data.lastSyncTime) {
                setLastSyncTime(new Date(data.lastSyncTime));
            }
        } catch (err) {
            console.warn("Error fetching last sync time:", err);
        }
    };

    useEffect(() => {
        // Fetch sync time on mount
        fetchLastSyncTime();

        // Set up listener for sync events
        const handleSyncUpdate = () => {
            console.log("Sync event received in AverageTimeInStatus");
            fetchLastSyncTime(); // Fetch new sync time when sync occurs
        };

        // Listen for custom sync event
        window.addEventListener('asana-sync-completed', handleSyncUpdate);
        
        return () => {
            window.removeEventListener('asana-sync-completed', handleSyncUpdate);
        };
    }, []); // Empty dependency array = only on mount

    useEffect(() => {
        // Calculate average durations from the tasks prop
        if (!tasks || tasks.length === 0) {
            setAvgDurations([]);
            return;
        }

        // Create a mapping of status to array of durations (in seconds)
        const statusDurations = {};
        
        // Initialize all statuses we want to track
        statusOrder.forEach(status => {
            statusDurations[status] = [];
        });

        // Process each task to calculate time spent in current status
        tasks.forEach(task => {
            const status = task.status;
            
            // Skip if status is not one we're tracking
            if (!statusOrder.includes(status)) {
                return;
            }
            
            // We need at least a creation date to calculate durations
            if (!task.createdAt) {
                return;
            }

            const startDate = new Date(task.createdAt);
            
            // Skip if start date is invalid
            if (isNaN(startDate.getTime())) {
                return;
            }
            
            // Determine end date based on completion status
            let endDate;
            if (task.completed && task.completedAt) {
                endDate = new Date(task.completedAt);
            } else {
                endDate = new Date(); // Use current time for open tasks
            }
            
            // Skip if end date is invalid
            if (isNaN(endDate.getTime())) {
                return;
            }
            
            // Calculate duration in seconds
            const durationSeconds = Math.max(0, (endDate - startDate) / 1000);
            
            // Only add reasonable durations (positive and less than 1 year)
            // This helps filter out potential data issues
            if (durationSeconds > 0 && durationSeconds < 31536000) { // 365 days
                statusDurations[status].push(durationSeconds);
            }
        });

        // Calculate averages and format into array for rendering
        const averages = [];
        
        statusOrder.forEach(status => {
            const durations = statusDurations[status];
            
            // Calculate average if we have data
            if (durations && durations.length > 0) {
                const total = durations.reduce((sum, duration) => sum + duration, 0);
                const average = total / durations.length;
                averages.push({ status, duration: average });
            } else {
                // Include status with N/A if no data
                averages.push({ status, duration: -1 }); // -1 will render as N/A
            }
        });

        setAvgDurations(averages);
    }, [tasks]);

    return (
        <div className="mb-8">
            <div className="flex justify-between items-center mb-1">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Average Age of Tasks by Status</h3>
                {lastSyncTime ? (
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-gray-100 dark:bg-gray-800">
                        Last sync: {format(lastSyncTime, 'PPpp')}
                    </div>
                ) : (
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        No sync data available
                    </div>
                )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4"> 
                (Note: Shows average age of tasks currently in each status; reflects your active filter selections)
            </p>
            {isLoading && (
                <div className="text-center text-gray-500 dark:text-gray-400 py-4">Loading averages...</div>
            )}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    Error: {error}
                </div>
            )}
            {!isLoading && !error && (!avgDurations || avgDurations.length === 0) && (
                <div className="text-gray-500 dark:text-gray-400 p-4 border rounded-lg shadow-sm bg-white dark:bg-gray-800 text-center">No average duration data available for active statuses.</div>
            )}
            {!isLoading && !error && avgDurations && avgDurations.length > 0 && (
                 // Use a grid layout similar to TaskSummary - adjust cols as needed
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {avgDurations.map(({ status, duration }) => (
                        <div key={status} className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 text-center">
                            {/* Limit status text length if necessary */}
                            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1 truncate" title={status}>{status}</h3>
                            <div className="text-3xl font-bold text-gray-900 dark:text-white">{formatSeconds(duration)}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default AverageTimeInStatus; 