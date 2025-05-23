import React, { useMemo, useState } from 'react';

export default function AssetSummary({ tasks }) {
  const [isExpanded, setIsExpanded] = useState(false);

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

  // Get top 3 for summary
  const topThree = assetStats.slice(0, 3);
  const totalAssets = assetStats.length;

  return (
    <div className="mb-8">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full bg-white dark:bg-customGray-800 rounded-xl shadow-lg p-6 text-left hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-customGray-900 dark:text-customGray-100 mb-2">
              Tasks by Asset Type
            </h3>
            <div className="text-sm text-customGray-600 dark:text-customGray-400">
              {topThree.length > 0 ? (
                <>
                  Top assets: {topThree.map((asset, index) => (
                    <span key={asset.assetType}>
                      <span className="font-medium text-customGray-700 dark:text-customGray-300">
                        {asset.assetType}
                      </span>
                      <span className="ml-1 text-primary font-semibold">({asset.count})</span>
                      {index < topThree.length - 1 && ', '}
                    </span>
                  ))}
                  {totalAssets > 3 && (
                    <span className="ml-2 text-customGray-500">
                      +{totalAssets - 3} more
                    </span>
                  )}
                </>
              ) : (
                'No asset data available'
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary">{totalAssets}</span>
            <svg
              className={`w-5 h-5 text-customGray-400 transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      {/* Expandable Content */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-customGray-50 dark:bg-customGray-700/50 rounded-xl p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {assetStats.map(({ assetType, count }) => (
              <div key={assetType} className="bg-white dark:bg-customGray-800 rounded-lg p-4 text-center shadow-sm">
                <h4 className="text-customGray-600 dark:text-customGray-400 text-sm font-medium mb-2 truncate" title={assetType}>
                  {assetType}
                </h4>
                <div className="text-2xl font-bold text-customGray-900 dark:text-customGray-100">{count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 