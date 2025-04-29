import { createServerSupabaseClient } from '@/lib/supabaseClient';
import { differenceInSeconds, parseISO } from 'date-fns';

// Helper function to calculate durations
function calculateStatusDurations(statusHistory) {
  if (!statusHistory || statusHistory.length === 0) {
    return [];
  }

  // Sort history chronologically
  const sortedHistory = [...statusHistory].sort((a, b) => 
    parseISO(a.recorded_at).getTime() - parseISO(b.recorded_at).getTime()
  );

  const durations = [];
  for (let i = 0; i < sortedHistory.length; i++) {
    const currentEntry = sortedHistory[i];
    const nextEntry = sortedHistory[i + 1];
    
    // Determine the end time for the current status
    // If it's the last entry, the duration calculation might depend on whether the task is considered "ongoing" 
    // in this status or if we should use the current time. For simplicity, we'll assume the duration ends
    // when the next status begins. If it's the last status, its duration isn't explicitly calculated here
    // unless you define an end point (e.g., task completion time or current time).
    // Let's calculate duration based on the start time of the next status.

    let durationSeconds = 0;
    if (nextEntry) {
        try {
            const startTime = parseISO(currentEntry.recorded_at);
            const endTime = parseISO(nextEntry.recorded_at);
            durationSeconds = differenceInSeconds(endTime, startTime);
        } catch (e) {
            console.error(`Error parsing dates for task ${currentEntry.task_id}:`, e);
            durationSeconds = 0; // Handle potential date parsing errors
        }
    }

    // Add the status and its duration (if calculable)
    if (durationSeconds > 0) { // Only add entries with a calculated duration
        durations.push({
            status: currentEntry.status,
            duration: durationSeconds, // Duration in seconds
            startDate: currentEntry.recorded_at,
            endDate: nextEntry ? nextEntry.recorded_at : null, // Indicate end if available
        });
    }
  }

  return durations;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  const { taskId } = req.query;

  if (!taskId) {
    return res.status(400).json({ message: 'taskId query parameter is required' });
  }

  try {
    // Use the server-side client
    const supabaseServerClient = createServerSupabaseClient(); 

    const { data, error } = await supabaseServerClient
      .from('task_status_history')
      .select('*')
      .eq('task_id', taskId)
      .order('recorded_at', { ascending: true }); // Ensure order for calculation

    if (error) {
      console.error('Supabase error fetching status history:', error);
      throw new Error(error.message);
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ message: `No status history found for task ID: ${taskId}` });
    }

    // Calculate durations
    const durations = calculateStatusDurations(data);

    // Return the task details along with durations
    const taskDetails = data[0]; // Get details from the first entry (assuming task_name etc. are consistent)
    return res.status(200).json({
        taskId: taskDetails.task_id,
        taskName: taskDetails.task_name, // Include task name for context
        statusDurations: durations,
        // Optionally include other details like brand, asset, etc.
        brand: taskDetails.brand,
        asset: taskDetails.asset,
        assignee: taskDetails.assignee,
        requester: taskDetails.requester,
        taskType: taskDetails.task_type,
    });

  } catch (error) {
    console.error('API Error fetching task status durations:', error);
    return res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
} 