import { createServerSupabaseClient } from '@/lib/supabaseClient';
import { differenceInSeconds, parseISO } from 'date-fns';
import { requireAuth } from '@/lib/auth';

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
    
    let durationSeconds = 0;
    try {
      const startTime = parseISO(currentEntry.recorded_at);
      let endTime;
      
      if (nextEntry) {
        // If there's a next entry, use its start time as the end time
        endTime = parseISO(nextEntry.recorded_at);
      } else {
        // For the last status, use current time as the end time
        endTime = new Date();
      }
      
      durationSeconds = differenceInSeconds(endTime, startTime);
    } catch (e) {
      console.error(`Error parsing dates for task ${currentEntry.task_id}:`, e);
      durationSeconds = 0; // Handle potential date parsing errors
    }

    // Add the status and its duration
    if (durationSeconds > 0) {
      durations.push({
        status: currentEntry.status,
        duration: durationSeconds, // Duration in seconds
        startDate: currentEntry.recorded_at,
        endDate: nextEntry ? nextEntry.recorded_at : new Date().toISOString(), // Use current time for the last entry
      });
    }
  }

  return durations;
}

async function taskStatusDurationsHandler(req, res) {
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

// Protect this API route with authentication
export default requireAuth(taskStatusDurationsHandler); 