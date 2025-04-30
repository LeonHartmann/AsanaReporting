import { createServerSupabaseClient } from '@/lib/supabaseClient';
import { requireAuth } from '@/lib/auth';

// Helper function to calculate durations
function calculateStatusDurations(statusHistory) {
  if (!statusHistory || statusHistory.length === 0) {
    return [];
  }

  // Sort history chronologically using native Date parsing
  const sortedHistory = [...statusHistory].sort((a, b) => {
    return new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime();
  });

  const durations = [];
  for (let i = 0; i < sortedHistory.length; i++) {
    const currentEntry = sortedHistory[i];
    const nextEntry = sortedHistory[i + 1];
    
    let durationSeconds = 0;
    try {
      const startTime = new Date(currentEntry.recorded_at);
      let endTime;
      
      if (nextEntry) {
        // If there's a next entry, use its start time as the end time
        endTime = new Date(nextEntry.recorded_at);
      } else {
        // For the last status, use current time as the end time
        endTime = new Date();
      }
      
      // Calculate duration in seconds
      durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
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

    // Wrap the Supabase query in a try-catch to handle any potential errors
    let data, error;
    try {
      const result = await supabaseServerClient
        .from('task_status_history')
        .select('*')
        .eq('task_id', taskId)
        .order('recorded_at', { ascending: true });
      
      data = result.data;
      error = result.error;
    } catch (supabaseError) {
      console.error('Unexpected error during Supabase query:', supabaseError);
      return res.status(500).json({ message: 'Database query failed' });
    }

    if (error) {
      console.error('Supabase error fetching status history:', error);
      return res.status(500).json({ message: error.message || 'Database error' });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ message: `No status history found for task ID: ${taskId}` });
    }

    // Calculate durations with error handling
    let durations = [];
    try {
      durations = calculateStatusDurations(data);
    } catch (calculationError) {
      console.error('Error calculating status durations:', calculationError);
      return res.status(500).json({ message: 'Error processing status duration data' });
    }

    // Return the task details along with durations
    const taskDetails = data[0]; // Get details from the first entry
    
    return res.status(200).json({
        taskId: taskDetails.task_id,
        taskName: taskDetails.task_name || 'Unknown Task', // Include task name with fallback
        statusDurations: durations,
        // Optionally include other details with fallbacks
        brand: taskDetails.brand || 'N/A',
        asset: taskDetails.asset || 'N/A',
        assignee: taskDetails.assignee || 'Unassigned',
        requester: taskDetails.requester || 'N/A',
        taskType: taskDetails.task_type || 'N/A',
    });

  } catch (error) {
    console.error('API Error fetching task status durations:', error);
    return res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
}

// Protect this API route with authentication
export default requireAuth(taskStatusDurationsHandler); 