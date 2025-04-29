import { useState, useEffect } from 'react';

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

function AverageTimeInStatus() {
    const [avgDurations, setAvgDurations] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAverageDurations = async () => {
            setIsLoading(true);
            setError('');
            try {
                // TODO: Add filter query parameters if needed
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

        fetchAverageDurations();
    }, []); // Fetch on mount

    const sortedStatuses = Object.entries(avgDurations).sort(([statusA], [statusB]) => statusA.localeCompare(statusB));

    return (
        <div className="p-4 border rounded-lg shadow-sm bg-white dark:bg-gray-800">
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Average Time in Status</h3>
            {isLoading && <div className="text-center text-gray-500 dark:text-gray-400">Loading averages...</div>}
            {error && <div className="text-red-600">Error: {error}</div>}
            {!isLoading && !error && sortedStatuses.length === 0 && (
                <div className="text-gray-500 dark:text-gray-400">No average duration data available.</div>
            )}
            {!isLoading && !error && sortedStatuses.length > 0 && (
                <ul className="space-y-2">
                    {sortedStatuses.map(([status, avgSeconds]) => (
                        <li key={status} className="flex justify-between items-center text-sm">
                            <span className="text-gray-700 dark:text-gray-300">{status}:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{formatSeconds(avgSeconds)}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default AverageTimeInStatus; 