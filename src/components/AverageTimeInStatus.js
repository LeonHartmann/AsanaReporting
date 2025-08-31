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

// Define the custom status order with display names and colors
const statusConfig = [
    { key: '📃 To Do ', displayName: 'To Do', color: 'border-gray-400', bgColor: 'bg-gray-400' },
    { key: ' ☕️ Awaiting Info', displayName: 'Awaiting Info', color: 'border-orange-500', bgColor: 'bg-orange-500' },
    { key: '🎨 In progress', displayName: 'In Progress', color: 'border-blue-500', bgColor: 'bg-blue-500' },
    { key: '📩 In Review ', displayName: 'In Review', color: 'border-yellow-500', bgColor: 'bg-yellow-500' },
    { key: '🌀 Completed/Feedback', displayName: 'Complete/Feedback', color: 'border-green-500', bgColor: 'bg-green-500' }
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
        // Fetch last sync time on component mount
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
        // Calculate average durations based on the tasks prop
        setIsLoading(true);
        setError('');

        try {
            // Check if tasks have status duration data
            if (!tasks || tasks.length === 0) {
                setAvgDurations([]);
                setIsLoading(false);
                return;
            }

            // Calculate average for each status
            const statusDurationsMap = {};
            const statusCountMap = {};

            // Process each task
            tasks.forEach(task => {
                // Process each status
                statusConfig.forEach(({ key }) => {
                    // Skip if the task doesn't have data for this status or it's N/A
                    if (!task[key] || task[key] === 'N/A') return;

                    // Parse the duration value (should be in seconds)
                    const durationValue = parseFloat(task[key]);
                    if (isNaN(durationValue)) return;

                    // Accumulate the duration values and count for averaging
                    if (!statusDurationsMap[key]) {
                        statusDurationsMap[key] = 0;
                        statusCountMap[key] = 0;
                    }
                    statusDurationsMap[key] += durationValue;
                    statusCountMap[key]++;
                });
            });

            // Calculate the averages
            const averages = [];
            statusConfig.forEach(({ key, displayName, color, bgColor }) => {
                if (statusDurationsMap[key] && statusCountMap[key]) {
                    const avgDuration = statusDurationsMap[key] / statusCountMap[key];
                    averages.push({
                        status: key,
                        displayName,
                        color,
                        bgColor,
                        duration: avgDuration
                    });
                }
            });

            setAvgDurations(averages);
        } catch (err) {
            console.error("Error calculating average durations:", err);
            setError("Failed to calculate average durations.");
        } finally {
            setIsLoading(false);
        }
    }, [tasks]); // Recalculate when tasks change

    return (
        <div className="mb-2">

            {isLoading && (
                <div className="text-center text-customGray-500 dark:text-customGray-400 py-4">Calculating averages...</div>
            )}
            
            {error && (
                <div className="bg-error/10 text-error px-4 py-3 rounded-lg mb-4" role="alert">
                    Error: {error}
                </div>
            )}
            
            {!isLoading && !error && (!avgDurations || avgDurations.length === 0) && (
                <div className="text-customGray-500 dark:text-customGray-400 p-4 rounded-lg shadow-sm bg-white dark:bg-customGray-800 text-center">
                    No average duration data available for active statuses.
                </div>
            )}
            
            {!isLoading && !error && avgDurations && avgDurations.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {avgDurations.map(({ status, displayName, color, bgColor, duration }) => (
                        <div key={status} className="flex items-center justify-between rounded-lg bg-customGray-50 dark:bg-customGray-800/60 p-4">
                            <div className="flex items-center gap-2">
                                <span className={`inline-block w-2.5 h-2.5 rounded-full ${bgColor}`}></span>
                                <span className="text-xs uppercase tracking-wide text-customGray-600 dark:text-customGray-300">{displayName}</span>
                            </div>
                            <div className="text-xl font-semibold text-customGray-900 dark:text-customGray-100">{formatSeconds(duration)}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default AverageTimeInStatus; 
