const ASANA_API_BASE = 'https://app.asana.com/api/1.0';
const ASANA_PAT = process.env.ASANA_PAT;
const ASANA_PROJECT_ID = process.env.ASANA_PROJECT_ID;

// Helper function to fetch all pages of data from an Asana endpoint
async function fetchAllPages(url) {
  let allData = [];
  let nextUrl = url;

  while (nextUrl) {
    console.log(`Fetching Asana data from: ${nextUrl}`); // Log fetching progress
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
  console.log(`Finished fetching Asana data. Total items: ${allData.length}`);
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
  const { brand, asset, requester, distinct } = filters;

  if (!ASANA_PAT || !ASANA_PROJECT_ID) {
    console.error('Asana PAT or Project ID is missing in environment variables.');
    throw new Error('Asana configuration missing.');
  }

  const projectTasksEndpoint = `${ASANA_API_BASE}/projects/${ASANA_PROJECT_ID}/tasks`;
  const limit = 100; // Keep limit for API requests per page

  try {
    if (distinct) {
      // --- Fetch All Tasks for Distinct Values --- 
      const distinctFields = 'name,assignee.name,custom_fields.name,custom_fields.display_value'; // Added assignee.name
      const distinctUrl = `${projectTasksEndpoint}?opt_fields=${distinctFields}&limit=${limit}`;
      
      const allTasksData = await fetchAllPages(distinctUrl);

      const distinctBrands = new Set();
      const distinctAssets = new Set();
      const distinctRequesters = new Set();
      const distinctAssignees = new Set(); // Added for assignees

      allTasksData.forEach(task => {
        // Brand from task name
        const brandMatch = task.name.match(/^\s*\[(.*?)\]/);
        if (brandMatch && brandMatch[1]) {
          distinctBrands.add(brandMatch[1].trim());
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
      });

      return {
        brands: Array.from(distinctBrands).sort(),
        assets: Array.from(distinctAssets).sort(),
        requesters: Array.from(distinctRequesters).sort(),
        assignees: Array.from(distinctAssignees).sort(), // Added assignees
      };
    } else {
      // --- Fetch All Tasks for Display --- 
      const displayFields = 'name,assignee.name,custom_fields.name,custom_fields.display_value,created_by.name,created_at'; // Added assignee.name
      const displayUrl = `${projectTasksEndpoint}?opt_fields=${displayFields}&limit=${limit}`;
      
      let allTasks = await fetchAllPages(displayUrl);

      // --- Apply Filters After Fetching --- 
      if (brand) {
        allTasks = allTasks.filter(task => getSafe(() => task.name.match(/^\s*\[(.*?)\]/)?.[1]?.trim().toLowerCase() === brand.toLowerCase()));
      }
      if (asset) {
        allTasks = allTasks.filter(task => {
          const displayValue = getSafe(() => task.custom_fields?.find(f => f.name === 'Assets')?.display_value);
          return displayValue?.includes(asset);
        });
      }
      if (requester) {
        allTasks = allTasks.filter(task => {
          const displayValue = getSafe(() => task.custom_fields?.find(f => f.name === 'Requested by')?.display_value);
          return displayValue === requester; // Exact match for requester
        });
      }

      // --- Format Tasks --- 
      const formattedTasks = allTasks.map(task => {
        const assetField = task.custom_fields?.find(f => f.name === 'Assets');
        const requesterField = task.custom_fields?.find(f => f.name === 'Requested by');
        const assetValue = assetField?.display_value;
        const requesterValue = requesterField?.display_value;

        return {
          id: task.gid,
          name: task.name,
          brand: getSafe(() => task.name.match(/^\s*\[(.*?)\]/)?.[1]?.trim(), 'N/A'),
          asset: assetValue || 'N/A',
          requester: requesterValue || 'N/A',
          assignee: task.assignee?.name || 'Unassigned', // Added assignee
          createdAt: task.created_at,
        };
      });

      return formattedTasks;
    }
  } catch (error) {
    console.error('Error fetching or processing Asana tasks:', error);
    // Ensure consistent return type on error
    return distinct ? { brands: [], assets: [], requesters: [] } : [];
  }
} 