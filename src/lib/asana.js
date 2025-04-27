const ASANA_API_BASE = 'https://app.asana.com/api/1.0';
const ASANA_PAT = process.env.ASANA_PAT;
const ASANA_PROJECT_ID = process.env.ASANA_PROJECT_ID;

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
  const fields = 'name,custom_fields.name,custom_fields.display_value,custom_fields.enum_value.name,custom_fields.text_value,created_by.name,created_at';
  const limit = 100;

  const url = `${projectTasksEndpoint}?opt_fields=${fields}&limit=${limit}`;

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

    if (distinct) {
      const distinctBrands = new Set();
      const distinctAssets = new Set();
      const distinctRequesters = new Set();

      const distinctFields = 'name,custom_fields.name,custom_fields.enum_value.name,custom_fields.text_value';
      const allTasksUrl = `${projectTasksEndpoint}?opt_fields=${distinctFields}&limit=${limit}`;
      const allTasksResponse = await fetch(allTasksUrl, { headers: { Authorization: `Bearer ${ASANA_PAT}`, Accept: 'application/json' } });
      if (!allTasksResponse.ok) throw new Error('Failed to fetch all tasks for distinct values');
      const allTasksResult = await allTasksResponse.json();
      const allTasksData = allTasksResult.data || [];

      allTasksData.forEach(task => {
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

    const formattedTasks = tasks.map(task => {
      // Find the custom fields first
      const assetField = task.custom_fields?.find(f => f.name === 'Asset');
      const requesterField = task.custom_fields?.find(f => f.name === 'Requested By');

      // Use display_value if available, otherwise default to 'N/A'
      const assetValue = assetField?.display_value;
      const requesterValue = requesterField?.display_value;

      return {
        id: task.gid,
        name: task.name,
        brand: getSafe(() => task.name.match(/^\s*\[(.*?)\]/)?.[1]?.trim(), 'N/A'),
        asset: assetValue || 'N/A', // Use 'N/A' if display_value is missing or falsy
        requester: requesterValue || 'N/A', // Use 'N/A' if display_value is missing or falsy
        createdAt: task.created_at,
      };
    });

    return formattedTasks;

  } catch (error) {
    console.error('Error fetching or processing Asana tasks:', error);
    return distinct ? { brands: [], assets: [], requesters: [] } : [];
  }
} 