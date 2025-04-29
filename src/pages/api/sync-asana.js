import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client (Ensure these are set in your .env.local)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL; // Use NEXT_PUBLIC_ for URL if needed client-side too
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use Service Role Key for backend operations
const asanaPAT = process.env.ASANA_PAT;
const asanaProjectId = process.env.ASANA_PROJECT_ID;

if (!supabaseUrl || !supabaseKey || !asanaPAT || !asanaProjectId) {
  console.error("Missing required environment variables for Asana sync.");
  // Optionally, you could throw an error during build or server start
}

// Create a single Supabase client instance
const supabase = createClient(supabaseUrl, supabaseKey);

// --- Helper Functions (Ported from Python) ---

function getSafe(obj, keys, defaultValue = null) {
  try {
    let current = obj;
    for (const key of keys) {
      if (current === null || current === undefined) {
        return defaultValue;
      }
      current = current[key];
    }
    // Check for final null/undefined after loop
    return (current === null || current === undefined) ? defaultValue : current;
  } catch (e) {
    // Log the error minimally or handle as needed
    // console.warn(`getSafe error accessing keys [${keys.join(', ')}]:`, e.message);
    return defaultValue;
  }
}


async function fetchTasksFromAsana(projectId, pat) {
  console.log(`Fetching tasks from Asana project ${projectId}`);
  const baseUrl = `https://app.asana.com/api/1.0/projects/${projectId}/tasks`;
  const fields = [
    "name",
    "assignee.name",
    "custom_fields.name",
    "custom_fields.display_value",
    "custom_fields.enum_value.name", // Adjusted to get enum name directly if possible
    "created_at",
    "completed",
    "completed_at",
    "memberships.section.name"
  ];

  const headers = {
    "Authorization": `Bearer ${pat}`,
    "Accept": "application/json"
  };

  let allTasks = [];
  let offset = null;

  try {
    while (true) {
      const params = new URLSearchParams({
        opt_fields: fields.join(','),
        limit: 100 // Asana default limit
      });
      if (offset) {
        params.append('offset', offset);
      }

      const url = `${baseUrl}?${params.toString()}`;
      console.log("Fetching URL:", url); // Log the URL being fetched

      const response = await fetch(url, { headers });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error fetching tasks from Asana: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`Asana API Error: ${response.status} - Check PAT and Project ID.`);
      }

      const data = await response.json();
      const tasksPage = data.data || [];
      allTasks = allTasks.concat(tasksPage);

      // Check for pagination
      const nextPage = data.next_page;
      if (nextPage && nextPage.offset) {
        offset = nextPage.offset;
        console.log(`Fetching next page of tasks (offset: ${offset})...`);
      } else {
        break; // No more pages
      }
    }
    console.log(`Successfully fetched ${allTasks.length} tasks from Asana`);
    return allTasks;
  } catch (error) {
    console.error("An error occurred during Asana fetch:", error);
    // Depending on desired behavior, return partial results or throw
    // Returning empty list here to mimic Python script's behavior on error
    return [];
  }
}


// --- Main API Handler ---

export default async function handler(req, res) {
  // Optional: Add security check (e.g., check for a secret key in header/query)
  // if (req.query.SECRET !== process.env.SYNC_SECRET) {
  //   return res.status(401).json({ message: 'Unauthorized' });
  // }

  if (req.method !== 'POST' && req.method !== 'GET') { // Allow GET for manual trigger/cron
    res.setHeader('Allow', ['POST', 'GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  console.log("--- Starting Asana Sync API Route ---");
  const scriptStartTime = Date.now();

  if (!supabaseUrl || !supabaseKey || !asanaPAT || !asanaProjectId) {
    console.error("Sync cannot proceed: Missing required environment variables.");
    return res.status(500).json({ message: "Server configuration error: Missing environment variables." });
  }

  try {
    const tasks = await fetchTasksFromAsana(asanaProjectId, asanaPAT);

    if (!tasks || tasks.length === 0) {
      console.warn("No tasks fetched from Asana or an error occurred during fetch. Skipping database update.");
      const duration = (Date.now() - scriptStartTime) / 1000;
      return res.status(200).json({ message: "No tasks found or error fetching from Asana. No updates performed.", duration: `${duration.toFixed(2)}s` });
    }

    const currentTimestamp = new Date().toISOString();
    let processedCount = 0;
    let dbActionsCount = 0;
    const totalCount = tasks.length;
    const errors = []; // Collect errors during processing

    console.log(`Processing ${totalCount} tasks...`);

    for (const task of tasks) {
      const taskId = getSafe(task, ['gid']);
      if (!taskId) {
          console.warn("Task without gid found, skipping:", task);
          continue;
      }

      try {
        // --- Extract Task Data ---
        const taskName = getSafe(task, ['name'], 'Unnamed Task');
        const currentStatus = getSafe(task, ['memberships', 0, 'section', 'name'], 'No Status');
        const assignee = getSafe(task, ['assignee', 'name'], 'Unassigned');

        const customFields = getSafe(task, ['custom_fields'], []);
        const assetField = customFields.find(f => getSafe(f, ['name']) === 'Assets');
        const asset = getSafe(assetField, ['display_value'], 'N/A'); // Assuming display_value works

        const requesterField = customFields.find(f => getSafe(f, ['name']) === 'Requested by');
        const requester = getSafe(requesterField, ['display_value'], 'N/A'); // Assuming display_value

        const taskTypeField = customFields.find(f => getSafe(f, ['name']) === 'Task Type');
        // Use enum_value.name if available, otherwise display_value as fallback
        const taskType = getSafe(taskTypeField, ['enum_value', 'name'], getSafe(taskTypeField, ['display_value'], 'N/A'));

        // --- Supabase Logic ---
        const { data: latestRecords, error: selectError } = await supabase
          .from('task_status_history')
          .select('id, status, status_start')
          .eq('task_id', taskId)
          .order('recorded_at', { ascending: false }) // Correct Supabase v2 syntax
          .limit(1);

        if (selectError) {
          console.error(`Error querying Supabase for task ${taskId}: ${selectError.message}`);
          errors.push(`Task ${taskId}: DB Query Error - ${selectError.message}`);
          continue; // Skip this task
        }

        const latestRecord = latestRecords && latestRecords.length > 0 ? latestRecords[0] : null;

        const recordData = {
            task_id: taskId,
            task_name: taskName,
            status: currentStatus,
            recorded_at: currentTimestamp, // Timestamp of this sync run
            status_start: null, // Will be set below
            status_end: null,
            // Add other fields based on your table schema
            brand: taskName.toUpperCase(), // Assuming brand derivation logic
            asset: asset,
            assignee: assignee,
            requester: requester,
            task_type: taskType,
            // Include raw Asana completion data if needed
            // completed: getSafe(task, ['completed'], false),
            // completed_at: getSafe(task, ['completed_at']),
            // created_at: getSafe(task, ['created_at']),
        };

        if (!latestRecord) {
          // Case 1: First time seeing this task
          console.log(`Task ${taskId} (${taskName}): Adding initial record with status '${currentStatus}'`);
          recordData.status_start = currentTimestamp; // Starts now

          const { error: insertError } = await supabase.from('task_status_history').insert(recordData);
          if (insertError) {
            console.error(`Error inserting initial record for task ${taskId}: ${insertError.message}`);
            errors.push(`Task ${taskId}: DB Insert Error - ${insertError.message}`);
          } else {
            dbActionsCount++;
          }
        } else {
          // Case 2: Task exists
          const lastStatus = getSafe(latestRecord, ['status']);

          if (currentStatus !== lastStatus) {
            console.log(`Task ${taskId} (${taskName}): Status changed from '${lastStatus}' to '${currentStatus}'`);

            // Update end time of the previous record
            const { error: updateError } = await supabase
              .from('task_status_history')
              .update({ status_end: currentTimestamp })
              .eq('id', latestRecord.id);

            if (updateError) {
                console.error(`Error updating end time for task ${taskId}, record ${latestRecord.id}: ${updateError.message}`);
                errors.push(`Task ${taskId}: DB Update Error - ${updateError.message}`);
                // Decide if you should proceed to insert the new status or stop for this task
                // continue; // Option: Skip inserting new record if update failed
            }

            // Add new record for the new status
            recordData.status_start = currentTimestamp; // Starts now
            const { error: insertError } = await supabase.from('task_status_history').insert(recordData);

            if (insertError) {
                console.error(`Error inserting new status record for task ${taskId}: ${insertError.message}`);
                errors.push(`Task ${taskId}: DB Insert Error (New Status) - ${insertError.message}`);
            } else {
                // Only count as one action if both update (attempted) and insert succeeded
                if (!updateError) dbActionsCount++;
            }

          } else {
            // Status has NOT changed - log for info, no DB action
            console.log(`Task ${taskId} (${taskName}): Status '${currentStatus}' unchanged. No database update needed.`);
          }
        }
        processedCount++; // Mark task as processed (attempted)

      } catch (taskError) {
        console.error(`Error processing task ${taskId}: ${taskError.message}`, taskError);
        errors.push(`Task ${taskId}: Processing Error - ${taskError.message}`);
        // Continue to the next task
      }
    } // End task loop

    const duration = (Date.now() - scriptStartTime) / 1000;
    const successRate = totalCount > 0 ? (processedCount / totalCount) * 100 : 100;

    console.log(`--- Asana Sync Finished (${duration.toFixed(2)}s) ---`);
    console.log(`Processed: ${processedCount}/${totalCount} tasks (${successRate.toFixed(1)}% success)`);
    console.log(`Database Actions (Inserts/Updates): ${dbActionsCount}`);
    if (errors.length > 0) {
      console.warn(`Encountered ${errors.length} errors during processing.`);
      // Decide how to report errors (e.g., include in response)
    }

    res.status(200).json({
      message: `Sync complete. Processed ${processedCount}/${totalCount} tasks. Performed ${dbActionsCount} database actions.`,
      duration: `${duration.toFixed(2)}s`,
      processedCount,
      totalCount,
      dbActionsCount,
      errors: errors // Include detailed errors if needed
    });

  } catch (error) {
    const duration = (Date.now() - scriptStartTime) / 1000;
    console.error(`❌ Unhandled error in sync API route: ${error.message}`, error);
    res.status(500).json({
        message: `Sync failed: ${error.message}`,
        duration: `${duration.toFixed(2)}s`,
        error: error.toString() // Provide error details
    });
  }
} 