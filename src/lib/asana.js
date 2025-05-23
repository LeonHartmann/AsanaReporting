const ASANA_API_BASE = 'https://app.asana.com/api/1.0';
const ASANA_PAT = process.env.ASANA_PAT;
const ASANA_PROJECT_ID = process.env.ASANA_PROJECT_ID;

// Helper function to fetch all pages of data from an Asana endpoint
async function fetchAllPages(url) {
  let allData = [];
  let nextUrl = url;

  while (nextUrl) {
    const response = await fetch(nextUrl, {
      headers: {
        Authorization: `Bearer ${ASANA_PAT}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Asana API Error during pagination:', errorData);
      throw new Error(`Asana API request failed: ${response.statusText}`);
    }

    const result = await response.json();
    allData = allData.concat(result.data || []);

    // Check for next page offset
    if (result.next_page) {
      // Construct the next URL using the offset. Assumes original URL had query params.
      const urlObject = new URL(nextUrl); // Use URL constructor for easier param handling
      urlObject.searchParams.set('offset', result.next_page.offset);
      nextUrl = urlObject.toString();
    } else {
      nextUrl = null; // No more pages
    }
  }
  return allData;
}

// Helper function to safely access nested properties
const getSafe = (fn, defaultValue = null) => {
  try {
    return fn();
  } catch (e) {
    return defaultValue;
  }
};

export async function getTasks(filters = {}) {
  const { brand, asset, requester, assignee, startDate, endDate, distinct, completionFilter, taskType } = filters;

  if (!ASANA_PAT || !ASANA_PROJECT_ID) {
    console.error('Asana PAT or Project ID is missing in environment variables.');
    throw new Error('Asana configuration missing.');
  }

  const projectTasksEndpoint = `${ASANA_API_BASE}/projects/${ASANA_PROJECT_ID}/tasks`;
  const limit = 100; // Keep limit for API requests per page

  try {
    if (distinct) {
      // --- Fetch All Tasks for Distinct Values --- 
      const distinctFields = 'name,assignee.name,custom_fields.name,custom_fields.display_value,custom_fields.enum_value,completed'; // Added enum_value and completed
      const distinctUrl = `${projectTasksEndpoint}?opt_fields=${distinctFields}&limit=${limit}`;
      
      const allTasksData = await fetchAllPages(distinctUrl);

      const distinctBrands = new Set();
      const distinctAssets = new Set();
      const distinctRequesters = new Set();
      const distinctAssignees = new Set(); // Added for assignees
      const distinctTaskTypes = new Set(); // Added for task types

      allTasksData.forEach(task => {
        // Brand from task name (use entire name in uppercase)
        if (task.name) { // Ensure name exists
           distinctBrands.add(task.name.toUpperCase());
        }

        // Assets from custom field (multi-select handled)
        const assetField = task.custom_fields?.find(f => f.name === 'Assets');
        if (assetField?.display_value) {
          const values = assetField.display_value.split(', ');
          values.forEach(value => distinctAssets.add(value.trim()));
        }

        // Requester from custom field
        const requesterField = task.custom_fields?.find(f => f.name === 'Requested by');
        if (requesterField?.display_value) { // Use display_value here too for consistency
          distinctRequesters.add(requesterField.display_value);
        }

        // Assignee
        if (task.assignee?.name) {
          distinctAssignees.add(task.assignee.name);
        }

        // Task Type from custom field (using enum_value for single-select)
        const taskTypeField = task.custom_fields?.find(f => f.name === 'Task Type');
        if (taskTypeField?.enum_value?.name) { // Use enum_value.name for single-select
             distinctTaskTypes.add(taskTypeField.enum_value.name);
        }
      });

      return {
        brands: Array.from(distinctBrands).sort(),
        assets: Array.from(distinctAssets).sort(),
        requesters: Array.from(distinctRequesters).sort(),
        assignees: Array.from(distinctAssignees).sort(), // Added assignees
        taskTypes: Array.from(distinctTaskTypes).sort(), // Added task types
      };
    } else {
      // --- Fetch All Tasks for Display --- 
      const displayFields = 'name,assignee.name,custom_fields.name,custom_fields.display_value,custom_fields.enum_value,created_by.name,created_at,completed,completed_at,due_on,due_at,memberships.section.name'; // Add completed_at, deadline and section info
      const displayUrl = `${projectTasksEndpoint}?opt_fields=${displayFields}&limit=${limit}`;
      
      let allTasks = await fetchAllPages(displayUrl);

      // --- Apply Filters After Fetching ---

      // Brand Filtering (Handles comma-separated string for OR logic)
      if (brand) {
        const selectedBrands = brand.split(',').map(b => b.trim().toUpperCase()); // Split, trim, and uppercase
        if (selectedBrands.length > 0) {
          allTasks = allTasks.filter(task => {
            const taskBrand = task.name.toUpperCase();
            return selectedBrands.includes(taskBrand);
          });
        }
      }

      // Asset Filtering (Handles comma-separated string for OR logic on both filter and task data)
      if (asset) {
        const selectedAssets = asset.split(',').map(a => a.trim()); // Split and trim selected assets
        if (selectedAssets.length > 0) {
          allTasks = allTasks.filter(task => {
            const taskAssetsString = getSafe(() => task.custom_fields?.find(f => f.name === 'Assets')?.display_value);
            if (!taskAssetsString) return false; // Task has no asset
            // Split the task's assets and check if any match the selected assets
            const taskAssetsArray = taskAssetsString.split(',').map(a => a.trim());
            return taskAssetsArray.some(taskAsset => selectedAssets.includes(taskAsset));
          });
        }
      }

      // Requester Filtering (Handles comma-separated string for OR logic)
      if (requester) {
        const selectedRequesters = requester.split(',').map(r => r.trim()); // Split and trim
        if (selectedRequesters.length > 0) {
          allTasks = allTasks.filter(task => {
            const taskRequester = getSafe(() => task.custom_fields?.find(f => f.name === 'Requested by')?.display_value);
            return taskRequester && selectedRequesters.includes(taskRequester);
          });
        }
      }

      // Assignee Filtering (Already handles comma-separated list)
      if (assignee) {
        const selectedAssignees = assignee.split(',');
        if (selectedAssignees.length > 0) {
           allTasks = allTasks.filter(task => {
             const taskAssigneeName = getSafe(() => task.assignee?.name);
             // Include task if its assignee is in the selected list
             return taskAssigneeName && selectedAssignees.includes(taskAssigneeName);
           });
        }
      }
      
      // Task Type filtering
      if (taskType) {
          const selectedTaskTypes = taskType.split(',');
          if (selectedTaskTypes.length > 0) {
              const tasksBeforeFilter = allTasks; 
              allTasks = tasksBeforeFilter.filter(task => {
                  const taskTypeField = task.custom_fields?.find(f => f.name === 'Task Type');
                  const taskTypeValue = taskTypeField?.enum_value?.name;
                  const trimmedTaskTypeValue = taskTypeValue?.trim(); 
                  const shouldKeep = trimmedTaskTypeValue && selectedTaskTypes.includes(trimmedTaskTypeValue); 
                  return shouldKeep;
              });
          }
      }
      
      // Date range filtering
      if (startDate || endDate) {
        allTasks = allTasks.filter(task => {
          // Use created_at date for filtering
          if (!task.created_at) return false;
          
          const taskDate = new Date(task.created_at);
          // Skip tasks with invalid dates
          if (isNaN(taskDate.getTime())) return false;
          
          // Apply start date filter if provided
          if (startDate) {
            const startDateObj = new Date(startDate);
            // Set time to beginning of day
            startDateObj.setHours(0, 0, 0, 0);
            if (taskDate < startDateObj) return false;
          }
          
          // Apply end date filter if provided
          if (endDate) {
            const endDateObj = new Date(endDate);
            // Set time to end of day
            endDateObj.setHours(23, 59, 59, 999);
            if (taskDate > endDateObj) return false;
          }
          
          return true;
        });
      }

      // --- Format Tasks --- 
      const formattedTasks = allTasks.map(task => {
        const assetField = task.custom_fields?.find(f => f.name === 'Assets');
        const requesterField = task.custom_fields?.find(f => f.name === 'Requested by');
        const taskTypeField = task.custom_fields?.find(f => f.name === 'Task Type'); // Find Task Type field
        const assetValue = assetField?.display_value;
        const requesterValue = requesterField?.display_value;
        // Get Task Type value (use enum_value.name for single-select)
        const taskTypeValue = taskTypeField?.enum_value?.name;
        
        // Get task status from section if available
        const section = getSafe(() => task.memberships?.[0]?.section?.name);
        
        // Get deadline (prefer due_at for exact time, fallback to due_on for date only)
        const deadline = task.due_at || task.due_on;

        return {
          id: task.gid,
          name: task.name,
          brand: task.name.toUpperCase(),
          asset: assetValue || 'N/A',
          requester: requesterValue || 'N/A',
          assignee: task.assignee?.name || 'Unassigned',
          taskType: taskTypeValue || 'N/A', // Include task type (from enum_value)
          completed: task.completed, // Completion status
          status: section || 'No Status', // Section can be used as status
          deadline: deadline, // Task deadline
          createdAt: task.created_at,
          completedAt: task.completed_at, // Add completed_at
        };
      });
      
      // Filter out tasks with status '📍 Resources'
      const filteredTasks = formattedTasks.filter(task => task.status !== '📍 Resources');
      
      // Apply completion/status filter if specified
      let finalTasks = filteredTasks;
      const completedFeedbackStatus = '🌀 Completed/Feedback';

      // --- Start Filter Logic ---
      const initialTaskCount = filteredTasks.length; 
      let tasksAfterFilter = [];

      switch (completionFilter) {
          case 'only_completed': // Point 2: completed === true
              tasksAfterFilter = filteredTasks.filter(task => task.completed === true);
              break;
          case 'hide_completed': // Point 3: completed === false
              tasksAfterFilter = filteredTasks.filter(task => task.completed === false);
              break;
          case 'only_completed_feedback': // Point 4: completed === true OR status is Feedback
              tasksAfterFilter = filteredTasks.filter(task => 
                  task.completed === true || task.status?.trim() === completedFeedbackStatus
              );
              break;
          case 'hide_completed_feedback': // Point 5: completed === false AND status is NOT Feedback
              tasksAfterFilter = filteredTasks.filter(task => 
                  task.completed === false && task.status?.trim() !== completedFeedbackStatus
              );
              break;
          // New Status Cases
          case 'only_completed_feedback_status': // New: Added based on user feedback
              tasksAfterFilter = filteredTasks.filter(task => task.status?.trim() === completedFeedbackStatus);
              break;
          case 'only_closed_won':
              tasksAfterFilter = filteredTasks.filter(task => task.status?.trim() === '🟢 CLOSED WON');
              break;
          case 'only_closed_lost':
              tasksAfterFilter = filteredTasks.filter(task => task.status?.trim() === '🔴 CLOSED LOST');
              break;
          case 'all': // Point 1: All tasks (excluding '📍 Resources')
          default:
              tasksAfterFilter = filteredTasks; // Already filtered for '📍 Resources'
              break;
      }
      // --- End Filter Logic ---

      finalTasks = tasksAfterFilter;

      return finalTasks;
    }
  } catch (error) {
    console.error('Error fetching or processing Asana tasks:', error);
    return distinct ? { brands: [], assets: [], requesters: [], assignees: [], taskTypes: [] } : [];
  }
}

// Removed getProjectStories function 