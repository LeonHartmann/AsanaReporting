import React, { useMemo } from 'react';

export default function AssetSummary({ tasks }) {
  // Calculate asset type statistics
  const assetStats = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return [];
    }

    // Count tasks by asset type
    const assetCounts = {};
    
    tasks.forEach(task => {
      const assetsString = task.asset || 'N/A';
      if (assetsString !== 'N/A') {
        // Split by comma for multi-select assets
        const individualAssets = assetsString.split(',').map(a => a.trim()).filter(a => a);
        individualAssets.forEach(asset => {
          assetCounts[asset] = (assetCounts[asset] || 0) + 1;
        });
      } else {
        // Count tasks with no assets
        assetCounts['N/A'] = (assetCounts['N/A'] || 0) + 1;
      }
    });

    // Convert to array for rendering
    return Object.entries(assetCounts).map(([assetType, count]) => ({
      assetType,
      count
    })).sort((a, b) => b.count - a.count); // Sort by count in descending order
  }, [tasks]);

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 mb-8">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tasks by Asset Type</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {assetStats.map(({ assetType, count }) => (
          <div key={assetType} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
            <h4 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1 truncate" title={assetType}>
              {assetType}
            </h4>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{count}</div>
          </div>
        ))}
      </div>
    </div>
  );
} 