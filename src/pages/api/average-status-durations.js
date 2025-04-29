import { createServerSupabaseClient } from '@/lib/supabaseClient';

// Helper function to calculate durations for a single task's history
function calculateTaskStatusDurations(statusHistory) {
    // --- NEW: Log input history --- 
    console.log('[Debug] calculateTaskStatusDurations received history:', statusHistory);
    // --- END NEW --- 
    if (!statusHistory || statusHistory.length < 2) {
        return [];
    }
    
    const sortedHistory = [...statusHistory].sort((a, b) => {
        // --- NEW: Log sort values --- 
        console.log(`[Debug] Sorting: a.recorded_at = ${a?.recorded_at}, b.recorded_at = ${b?.recorded_at}`);
        // --- END NEW --- 
        try {
            const dateA = new Date(a.recorded_at);
            const dateB = new Date(b.recorded_at);
            const timeA = !isNaN(dateA.getTime()) ? dateA.getTime() : 0;
            const timeB = !isNaN(dateB.getTime()) ? dateB.getTime() : 0;
            return timeA - timeB;
        } catch (e) {
            console.error("[Debug] Error during native date sort comparison:", e, { a_rec: a?.recorded_at, b_rec: b?.recorded_at });
            return 0; 
        }
    });

    const durations = [];
    for (let i = 0; i < sortedHistory.length - 1; i++) {
        const currentEntry = sortedHistory[i];
        const nextEntry = sortedHistory[i + 1];
        // --- NEW: Log duration calculation values --- 
        console.log(`[Debug] Calculating duration for interval: start=${currentEntry?.recorded_at}, end=${nextEntry?.recorded_at}`);
        // --- END NEW --- 
        try {
            const startTime = new Date(currentEntry.recorded_at);
            const endTime = new Date(nextEntry.recorded_at);

            if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                console.warn(`[Debug] Skipping duration calculation (native) for interval in task ${currentEntry.task_id} due to invalid date(s):`, 
                    { start: currentEntry.recorded_at, end: nextEntry.recorded_at }
                );
                continue; 
            }
            
            const durationMillis = endTime.getTime() - startTime.getTime();
            const durationSeconds = Math.round(durationMillis / 1000); 

            if (durationSeconds >= 0) { 
                durations.push({ status: currentEntry.status, duration: durationSeconds });
            }
        } catch (e) {
            console.error(`[Debug] Error during native duration calculation for task ${currentEntry.task_id}:`, e, 
                { start: currentEntry?.recorded_at, end: nextEntry?.recorded_at }
            );
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
            // --- NEW: Log which task's history is being processed --- 
            if(taskHistory && taskHistory.length > 0) {
                 console.log(`[Debug] Processing history for task_id: ${taskHistory[0].task_id}`);
            }
            // --- END NEW --- 
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

        // --- NEW: Filter out specific statuses ---
        const statusesToExclude = ['Completed', 'CLOSED LOST', 'CLOSED WON', 'Resources'];
        const filteredAverageDurations = Object.entries(averageDurations)
            .filter(([status]) => !statusesToExclude.includes(status))
            .reduce((obj, [key, value]) => {
                obj[key] = value;
                return obj;
            }, {});
        // --- END NEW ---

        return res.status(200).json(filteredAverageDurations); // Return filtered data

    } catch (error) {
        console.error('API Error fetching average status durations:', error);
        return res.status(500).json({ message: error.message || 'Internal Server Error' });
    }
} 