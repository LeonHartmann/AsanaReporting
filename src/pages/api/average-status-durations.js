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

        // Call the database function to get average durations
        const { data: avgData, error: rpcError } = await supabaseServerClient
            .rpc('get_average_status_durations'); // Call the SQL function
            

        if (rpcError) {
            console.error('Supabase RPC error fetching average status durations:', rpcError);
            throw new Error(`Database RPC error: ${rpcError.message}`);
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