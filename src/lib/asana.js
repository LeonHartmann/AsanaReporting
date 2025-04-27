const ASANA_API_BASE = 'https://app.asana.com/api/1.0';
const ASANA_PAT = process.env.ASANA_PAT;
const ASANA_WORKSPACE_ID = process.env.ASANA_WORKSPACE_ID;

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

  if (!ASANA_PAT || !ASANA_WORKSPACE_ID) {
    console.error('Asana PAT or Workspace ID is missing in environment variables.');
    throw new Error('Asana configuration missing.');
  }

  const url = `${ASANA_API_BASE}/tasks?workspace=${ASANA_WORKSPACE_ID}&opt_fields=name,custom_fields.name,custom_fields.enum_value.name,custom_fields.text_value,created_by.name,created_at&limit=100`; // Adjust limit if needed

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${ASANA_PAT}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Asana API Error:', errorData);
      throw new Error(`Asana API request failed: ${response.statusText}`);
    }

    const result = await response.json();
    let tasks = result.data || [];

    // --- Filtering Logic ---
    if (brand) {
      tasks = tasks.filter(task => getSafe(() => task.name.toLowerCase().includes(brand.toLowerCase())));
    }
    if (asset) {
      tasks = tasks.filter(task =>
        getSafe(() => task.custom_fields.find(f => f.name === 'Asset')?.enum_value?.name === asset)
      );
    }
    if (requester) {
      tasks = tasks.filter(task =>
        getSafe(() => task.custom_fields.find(f => f.name === 'Requested By')?.text_value === requester)
      );
    }

    // --- Distinct Values Logic ---
    if (distinct) {
      const distinctBrands = new Set();
      const distinctAssets = new Set();
      const distinctRequesters = new Set();

      // Need to fetch *all* tasks first before filtering to get all distinct values
      const allTasksUrl = `${ASANA_API_BASE}/tasks?workspace=${ASANA_WORKSPACE_ID}&opt_fields=name,custom_fields.name,custom_fields.enum_value.name,custom_fields.text_value&limit=100`;
      const allTasksResponse = await fetch(allTasksUrl, { headers: { Authorization: `Bearer ${ASANA_PAT}`, Accept: 'application/json' } });
      if (!allTasksResponse.ok) throw new Error('Failed to fetch all tasks for distinct values');
      const allTasksResult = await allTasksResponse.json();
      const allTasksData = allTasksResult.data || [];

      allTasksData.forEach(task => {
        // Simple brand extraction (assumes format like "[BRAND] Task Title")
        const brandMatch = task.name.match(/^\s*\[(.*?)\]/);
        if (brandMatch && brandMatch[1]) {
          distinctBrands.add(brandMatch[1].trim());
        }

        const assetField = task.custom_fields?.find(f => f.name === 'Asset');
        if (assetField?.enum_value?.name) {
          distinctAssets.add(assetField.enum_value.name);
        }

        const requesterField = task.custom_fields?.find(f => f.name === 'Requested By');
        if (requesterField?.text_value) {
          distinctRequesters.add(requesterField.text_value);
        }
      });

      return {
        brands: Array.from(distinctBrands).sort(),
        assets: Array.from(distinctAssets).sort(),
        requesters: Array.from(distinctRequesters).sort(),
      };
    }

    // --- Format Task Data ---
    const formattedTasks = tasks.map(task => ({
      id: task.gid,
      name: task.name,
      // Extract brand assuming format "[BRAND] Task Title"
      brand: getSafe(() => task.name.match(/^\s*\[(.*?)\]/)?.[1]?.trim(), 'N/A'),
      asset: getSafe(() => task.custom_fields?.find(f => f.name === 'Asset')?.enum_value?.name, 'N/A'),
      requester: getSafe(() => task.custom_fields?.find(f => f.name === 'Requested By')?.text_value, 'N/A'),
      createdAt: task.created_at,
    }));

    return formattedTasks;

  } catch (error) {
    console.error('Error fetching or processing Asana tasks:', error);
    // Return an empty array or specific error structure if needed by the frontend
    return distinct ? { brands: [], assets: [], requesters: [] } : [];
  }
} 