import { createServerSupabaseClient } from '@/lib/supabaseClient';
import { differenceInSeconds, parseISO } from 'date-fns';

// Helper function to calculate durations for a single task's history
function calculateTaskStatusDurations(statusHistory) {
    if (!statusHistory || statusHistory.length < 2) { // Need at least two points to calculate duration
        return [];
    }
    
    // --- UPDATED: Robust date sorting --- 
    const sortedHistory = [...statusHistory].sort((a, b) => {
        try {
            const dateA = parseISO(a.recorded_at);
            const dateB = parseISO(b.recorded_at);

            // Check if dates are valid before calling getTime()
            const timeA = !isNaN(dateA.getTime()) ? dateA.getTime() : 0; // Default invalid dates to 0 (or handle differently)
            const timeB = !isNaN(dateB.getTime()) ? dateB.getTime() : 0;
            
            return timeA - timeB;
        } catch (e) {
            // Fallback if parseISO itself throws an error (less likely)
            console.error("Error during date sort comparison:", e);
            return 0; 
        }
    });
    // --- END UPDATE --- 

    const durations = [];
    for (let i = 0; i < sortedHistory.length - 1; i++) {
        const currentEntry = sortedHistory[i];
        const nextEntry = sortedHistory[i + 1];
        try {
            const startTime = parseISO(currentEntry.recorded_at);
            const endTime = parseISO(nextEntry.recorded_at);

            // --- NEW: Check if dates are valid before calculating difference --- 
            if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                console.warn(`Skipping duration calculation for interval in task ${currentEntry.task_id} due to invalid date(s):`, 
                    { start: currentEntry.recorded_at, end: nextEntry.recorded_at }
                );
                continue; // Skip to the next interval
            }
            // --- END NEW --- 

            const durationSeconds = differenceInSeconds(endTime, startTime);
            if (durationSeconds >= 0) { // Ensure duration is not negative
                durations.push({ status: currentEntry.status, duration: durationSeconds });
            }
        } catch (e) {
            console.error(`Error during duration calculation for task ${currentEntry.task_id}:`, e);
        }
    }
    return durations;
}

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }

    // TODO: Implement filter handling later based on req.query if needed
    // const { brand, asset, requester, assignee, taskType, startDate, endDate } = req.query;

    try {
        const supabaseServerClient = createServerSupabaseClient();

        // Fetch all history data
        // WARNING: This might fetch a large amount of data. Consider pagination or filtering.
        // Fetching only necessary columns might improve performance.
        const { data: allHistory, error: fetchError } = await supabaseServerClient
            .from('task_status_history')
            .select('task_id, status, recorded_at') // Select only needed columns
            .order('task_id').order('recorded_at'); // Order by task_id then time

        if (fetchError) {
            console.error('Supabase error fetching all status history:', fetchError);
            throw new Error(fetchError.message);
        }

        if (!allHistory || allHistory.length === 0) {
            return res.status(200).json({}); // Return empty object if no history
        }

        // Group history by task_id
        const historyByTask = allHistory.reduce((acc, record) => {
            if (!acc[record.task_id]) {
                acc[record.task_id] = [];
            }
            acc[record.task_id].push(record);
            return acc;
        }, {});

        // Calculate durations for each task and aggregate
        const statusAggregates = {}; // { status: { totalDuration: number, count: number } }

        Object.values(historyByTask).forEach(taskHistory => {
            const taskDurations = calculateTaskStatusDurations(taskHistory);
            taskDurations.forEach(({ status, duration }) => {
                if (!statusAggregates[status]) {
                    statusAggregates[status] = { totalDuration: 0, count: 0 };
                }
                statusAggregates[status].totalDuration += duration;
                statusAggregates[status].count += 1;
            });
        });

        // Calculate averages
        const averageDurations = {};
        for (const status in statusAggregates) {
            const aggregate = statusAggregates[status];
            if (aggregate.count > 0) {
                averageDurations[status] = aggregate.totalDuration / aggregate.count;
            }
        }

        return res.status(200).json(averageDurations); // Returns { status: averageDurationSeconds }

    } catch (error) {
        console.error('API Error fetching average status durations:', error);
        return res.status(500).json({ message: error.message || 'Internal Server Error' });
    }
} 