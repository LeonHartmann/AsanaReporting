import { getTasks } from '@/lib/asana';
import { requireAuth } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabaseClient';

async function tasksHandler(req, res) {
  if (req.method === 'GET') {
    // Log the raw query object received from the request
    // console.log('[API Handler Debug] Received req.query:', JSON.stringify(req.query, null, 2));

    const { brand, asset, requester, assignee, startDate, endDate, distinct, completionFilter, taskType } = req.query;

    // Basic input validation/sanitization could be added here

    try {
      const filters = {
        brand: brand || undefined,
        asset: asset || undefined,
        requester: requester || undefined,
        assignee: assignee || undefined,
        taskType: taskType || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        distinct: distinct === 'true', // Convert string 'true' to boolean
        completionFilter: completionFilter || undefined,
      };

      // Log the constructed filters object before passing it to getTasks
      // console.log('[API Handler Debug] Constructed Filters for getTasks:', JSON.stringify(filters, null, 2));

      const data = await getTasks(filters);
      
      // If not requesting distinct values, fetch and add status durations
      if (!filters.distinct) {
        // Get all task IDs to fetch status durations
        const taskIds = data.map(task => task.id);
        
        if (taskIds.length > 0) {
          try {
            // Fetch status durations for all tasks
            const supabaseClient = createServerSupabaseClient();
            const { data: statusDurations, error } = await supabaseClient
              .from('task_status_history')
              .select('*')
              .in('task_id', taskIds)
              .order('recorded_at', { ascending: true });
            
            if (error) {
              console.error('Error fetching task status durations:', error);
            } else if (statusDurations) {
              // Group status durations by task ID
              const taskStatusMap = {};
              statusDurations.forEach(record => {
                if (!taskStatusMap[record.task_id]) {
                  taskStatusMap[record.task_id] = [];
                }
                taskStatusMap[record.task_id].push(record);
              });
              
              // Calculate durations for each task
              data.forEach(task => {
                const taskHistory = taskStatusMap[task.id] || [];
                const statusDurations = calculateStatusDurations(taskHistory);
                
                // Add duration for each status to the task
                const statusColumns = [
                  '📃 To Do',
                  '☕️ Awaiting Info',
                  '🎨 In progress',
                  '📩 In Review',
                  '🌀 Completed/Feedback'
                ];
                
                statusColumns.forEach(status => {
                  // Find the duration for this status
                  const statusEntry = statusDurations.find(d => d.status === status);
                  task[status] = statusEntry ? statusEntry.duration : 'N/A';
                });
              });
            }
          } catch (err) {
            console.error('Error processing task status durations:', err);
            // Continue without status durations if there's an error
          }
        }
      }
      
      return res.status(200).json(data);
    } catch (error) {
      console.error('API Error fetching tasks:', error);
      // Don't expose detailed internal errors to the client
      return res.status(500).json({ message: 'Failed to fetch tasks from Asana.' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

// Helper function to calculate durations for each status
function calculateStatusDurations(statusHistory) {
  if (!statusHistory || statusHistory.length === 0) {
    return [];
  }

  // Sort history chronologically
  const sortedHistory = [...statusHistory].sort((a, b) => {
    const dateA = new Date(a.recorded_at).getTime();
    const dateB = new Date(b.recorded_at).getTime();
    return dateA - dateB;
  });

  const durations = [];
  const statusMap = {}; // To accumulate time for each status

  for (let i = 0; i < sortedHistory.length; i++) {
    const currentEntry = sortedHistory[i];
    const nextEntry = sortedHistory[i + 1];
    
    try {
      const startTime = new Date(currentEntry.recorded_at);
      
      let endTime;
      if (nextEntry) {
        endTime = new Date(nextEntry.recorded_at);
      } else {
        // For the last status, calculate duration up to now
        endTime = new Date();
      }
      
      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) continue;
      
      const durationSeconds = Math.max(0, (endTime.getTime() - startTime.getTime()) / 1000);
      
      // Accumulate duration for this status
      const status = currentEntry.status;
      if (!statusMap[status]) {
        statusMap[status] = 0;
      }
      statusMap[status] += durationSeconds;
    } catch (e) {
      console.error(`Error processing dates for task status:`, e);
    }
  }

  // Convert the map to an array of objects
  for (const [status, duration] of Object.entries(statusMap)) {
    durations.push({
      status,
      duration
    });
  }

  return durations;
}

// Protect this API route with authentication
export default requireAuth(tasksHandler); 