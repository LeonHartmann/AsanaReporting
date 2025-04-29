import { createServerSupabaseClient } from '@/lib/supabaseClient';

// Helper function to calculate durations for a single task's history
// REMOVED: This function is no longer needed as calculation is done in SQL.
// function calculateTaskStatusDurations(statusHistory) { ... }

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }

    // TODO: Implement filter handling later based on req.query if needed
    // const { brand, asset, requester, assignee, taskType, startDate, endDate } = req.query;

    try {
        const supabaseServerClient = createServerSupabaseClient();

        // Fetch average durations directly from the database
        // Calculate duration in seconds: status_end - status_start
        // If status_end is NULL, use the current time (NOW())
        const { data: avgData, error: fetchError } = await supabaseServerClient
            .from('task_status_history')
            .select(`
                status,
                avg(extract(epoch from (coalesce(status_end, now()) - status_start))) as average_duration_seconds
            `)
            .filter('status_start', 'isnot', null) // Ensure we only consider entries with a start time
            // Optional: Add a filter to exclude extremely long durations if needed (e.g., > 1 year)
            // .filter(extract(epoch from (coalesce(status_end, now()) - status_start)), 'lt', 31536000) 
            .groupBy('status');

        if (fetchError) {
            console.error('Supabase error fetching average status durations:', fetchError);
            throw new Error(`Database error: ${fetchError.message}`);
        }

        if (!avgData) {
            return res.status(200).json({}); // Return empty object if no data
        }

        // Format the data for the frontend
        const averageDurations = avgData.reduce((acc, row) => {
            if (row.status && row.average_duration_seconds !== null) {
                // Ensure average is non-negative
                acc[row.status] = Math.max(0, row.average_duration_seconds); 
            }
            return acc;
        }, {});

        // Filter out specific statuses (can be done here or in the frontend)
        // Note: Filtering in the frontend (as it was) allows flexibility
        // but filtering here might be slightly more efficient if the list is static.
        const statusesToExclude = ['✅ Completed', '🔴 CLOSED LOST', '🟢 CLOSED WON', '📍 Resources']; // Keep using frontend values
        const filteredAverageDurations = Object.entries(averageDurations)
            .filter(([status]) => !statusesToExclude.includes(status))
            .reduce((obj, [key, value]) => {
                obj[key] = value;
                return obj;
            }, {});

        return res.status(200).json(filteredAverageDurations);

    } catch (error) {
        console.error('API Error fetching average status durations:', error);
        // Provide a more generic error message to the client
        return res.status(500).json({ message: 'Failed to calculate average status durations.' });
    }
} 