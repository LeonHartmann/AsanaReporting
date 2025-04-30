import { createServerSupabaseClient } from '@/lib/supabaseClient';
import { requireAuth } from '@/lib/auth';

// Helper function to safely parse a date
function parseDate(dateString) {
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch (e) {
    return null;
  }
}

// Helper function to calculate durations with minimal dependencies
function calculateStatusDurations(history) {
  // If no history, return empty array
  if (!history || !Array.isArray(history) || history.length === 0) {
    return [];
  }

  // Sort by recorded_at date manually
  const sorted = [...history];
  sorted.sort(function(a, b) {
    const dateA = parseDate(a.recorded_at);
    const dateB = parseDate(b.recorded_at);
    
    // Handle null dates
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    
    // Standard date comparison
    return dateA.getTime() - dateB.getTime();
  });

  // Calculate durations
  const results = [];
  const statusDurations = {};

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    
    // Skip entries with invalid dates
    const startDate = parseDate(current.recorded_at);
    if (!startDate) continue;
    
    let endDate;
    if (next) {
      endDate = parseDate(next.recorded_at);
      if (!endDate) continue; // Skip if next date is invalid
    } else {
      endDate = new Date(); // Use current time for last status
    }
    
    // Calculate duration in seconds
    const durationMs = endDate.getTime() - startDate.getTime();
    const durationSec = Math.floor(durationMs / 1000);
    
    if (durationSec <= 0) continue; // Skip negative or zero durations
    
    // Add to status map
    const status = current.status;
    if (!statusDurations[status]) {
      statusDurations[status] = 0;
    }
    statusDurations[status] += durationSec;
  }
  
  // Convert to array
  for (const status in statusDurations) {
    results.push({
      status: status,
      duration: statusDurations[status]
    });
  }
  
  return results;
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
    // Create Supabase client
    const supabase = createServerSupabaseClient(); 
    
    // Query the database
    const { data, error } = await supabase
      .from('task_status_history')
      .select('*')
      .eq('task_id', taskId)
      .order('recorded_at', { ascending: true });
    
    // Handle errors
    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ message: 'Database error: ' + error.message });
    }
    
    // Handle no data
    if (!data || data.length === 0) {
      return res.status(404).json({ message: 'No status history found for this task' });
    }
    
    // Calculate durations
    let durations = [];
    try {
      durations = calculateStatusDurations(data);
    } catch (e) {
      console.error('Error calculating durations:', e);
      return res.status(500).json({ message: 'Error calculating status durations' });
    }
    
    // Get task details from first entry
    const taskDetails = data[0] || {};
    
    // Construct Asana task URL
    const asanaTaskUrl = taskId ? `https://app.asana.com/0/${taskId}` : null;
    
    // Return response
    return res.status(200).json({
      taskId: taskDetails.task_id || taskId,
      taskName: taskDetails.task_name || 'Unknown Task',
      statusDurations: durations,
      brand: taskDetails.brand || 'N/A',
      asset: taskDetails.asset || 'N/A',
      assignee: taskDetails.assignee || 'Unassigned',
      requester: taskDetails.requester || 'N/A',
      taskType: taskDetails.task_type || 'N/A',
      asanaUrl: asanaTaskUrl
    });
  } catch (e) {
    console.error('API handler error:', e);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Export with auth protection
export default requireAuth(taskStatusDurationsHandler); 