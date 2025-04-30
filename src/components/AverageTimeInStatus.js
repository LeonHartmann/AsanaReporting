import { useState, useEffect } from 'react';
import { format } from 'date-fns'; // Import format for date formatting

// Helper to format seconds into a readable string (e.g., "1d 2h 30m")
// (Copied from TaskStatusDurations - consider moving to a utils file)
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

// Define the custom status order
const statusOrder = [
    '📃 To Do',
    '☕️ Awaiting Info',
    '🎨 In progress',
    '📩 In Review',
    '🌀 Completed/Feedback'
];

function AverageTimeInStatus() {
    const [avgDurations, setAvgDurations] = useState({});
    const [isLoading, setIsLoading] = useState(true);
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
        const fetchAverageDurations = async () => {
            setIsLoading(true);
            setError('');
            try {
                // Fetch average durations
                const res = await fetch('/api/average-status-durations');
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.message || `Error fetching averages: ${res.statusText}`);
                }
                const data = await res.json();
                setAvgDurations(data);
            } catch (err) {
                console.error("Failed to fetch average status durations:", err);
                setError(err.message || 'Could not load average durations.');
                setAvgDurations({});
            } finally {
                setIsLoading(false);
            }
        };

        // Fetch both data on mount
        fetchAverageDurations();
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

    // The data from the API (avgDurations) is now an array of {status, duration} objects
    // No filtering or sorting needed here as the API handles it.
    const orderedStatusData = avgDurations; // Rename for clarity, it's already ordered

    return (
        <div className="mb-8">
            <div className="flex justify-between items-center mb-1">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Average Time in Status</h3>
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
                (Note: Averages become more accurate as more historical data is collected and filter doesn't apply here)
            </p>
            {isLoading && (
                <div className="text-center text-gray-500 dark:text-gray-400 py-4">Loading averages...</div>
            )}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    Error: {error}
                </div>
            )}
            {!isLoading && !error && (!orderedStatusData || orderedStatusData.length === 0) && (
                <div className="text-gray-500 dark:text-gray-400 p-4 border rounded-lg shadow-sm bg-white dark:bg-gray-800 text-center">No average duration data available for active statuses.</div>
            )}
            {!isLoading && !error && orderedStatusData && orderedStatusData.length > 0 && (
                 // Use a grid layout similar to TaskSummary - adjust cols as needed
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {orderedStatusData.map(({ status, duration }) => (
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