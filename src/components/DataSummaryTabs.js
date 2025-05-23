import React, { useMemo, useState } from 'react';
import { differenceInHours, differenceInDays, parseISO } from 'date-fns';

const TIME_FRAMES = {
  LT_24H: 'Less than 24h',
  LT_7D: 'Less than 7 Days',
  LT_14D: 'Less than 14 Days',
  LT_1M: 'Less than 1 Month',
  GE_1M: 'More than 1 Month',
};

export default function DataSummaryTabs({ tasks, isLoading }) {
  const [activeTab, setActiveTab] = useState(null); // null means all collapsed

  // Calculate asset type statistics
  const assetStats = useMemo(() => {
    if (!tasks || tasks.length === 0) return [];

    const assetCounts = {};
    tasks.forEach(task => {
      const assetsString = task.asset || 'N/A';
      if (assetsString !== 'N/A') {
        const individualAssets = assetsString.split(',').map(a => a.trim()).filter(a => a);
        individualAssets.forEach(asset => {
          assetCounts[asset] = (assetCounts[asset] || 0) + 1;
        });
      } else {
        assetCounts['N/A'] = (assetCounts['N/A'] || 0) + 1;
      }
    });

    return Object.entries(assetCounts).map(([assetType, count]) => ({
      assetType, count
    })).sort((a, b) => b.count - a.count);
  }, [tasks]);

  // Calculate task type statistics
  const taskTypeStats = useMemo(() => {
    if (!tasks || tasks.length === 0) return [];

    const taskTypeCounts = {};
    tasks.forEach(task => {
      const taskType = task.taskType || 'N/A';
      taskTypeCounts[taskType] = (taskTypeCounts[taskType] || 0) + 1;
    });

    return Object.entries(taskTypeCounts).map(([taskType, count]) => ({
      taskType, count
    })).sort((a, b) => b.count - a.count);
  }, [tasks]);

  // Calculate completion statistics
  const completionStats = useMemo(() => {
    if (!tasks) {
      return { [TIME_FRAMES.LT_24H]: 0, [TIME_FRAMES.LT_7D]: 0, [TIME_FRAMES.LT_14D]: 0, [TIME_FRAMES.LT_1M]: 0, [TIME_FRAMES.GE_1M]: 0 };
    }

    const counts = {
      [TIME_FRAMES.LT_24H]: 0,
      [TIME_FRAMES.LT_7D]: 0,
      [TIME_FRAMES.LT_14D]: 0,
      [TIME_FRAMES.LT_1M]: 0,
      [TIME_FRAMES.GE_1M]: 0,
    };

    const completedTasks = tasks.filter(t => t.completed && t.completedAt && t.createdAt);

    completedTasks.forEach(task => {
      try {
        const completedDate = parseISO(task.completedAt);
        const createdDate = parseISO(task.createdAt);

        if (isNaN(completedDate.getTime()) || isNaN(createdDate.getTime())) {
          return; 
        }

        const diffHours = differenceInHours(completedDate, createdDate);
        const diffDays = differenceInDays(completedDate, createdDate);

        if (diffHours < 24 && diffHours >= 0) {
          counts[TIME_FRAMES.LT_24H]++;
        } else if (diffDays < 7 && diffDays >= 0) {
          counts[TIME_FRAMES.LT_7D]++;
        } else if (diffDays < 14 && diffDays >= 0) {
          counts[TIME_FRAMES.LT_14D]++;
        } else if (diffDays < 30 && diffDays >= 0) {
          counts[TIME_FRAMES.LT_1M]++;
        } else if (diffDays >= 30) {
          counts[TIME_FRAMES.GE_1M]++;
        }
      } catch (e) {
        console.warn(`Error processing completion time for task ${task.id}:`, e);
      }
    });

    return counts;
  }, [tasks]);

  // Prepare summary data
  const topAssets = assetStats.slice(0, 3);
  const topTaskTypes = taskTypeStats.slice(0, 3);
  const fastestCount = completionStats[TIME_FRAMES.LT_24H];
  const weekCount = completionStats[TIME_FRAMES.LT_7D];
  const slowestCount = completionStats[TIME_FRAMES.GE_1M];
  const totalCompleted = Object.values(completionStats).reduce((sum, count) => sum + count, 0);

  const handleTabClick = (tabName) => {
    setActiveTab(activeTab === tabName ? null : tabName); // Toggle or switch
  };

  const renderTabButton = (tabName, title, summary, count) => (
    <button
      key={tabName}
      onClick={() => handleTabClick(tabName)}
      className={`flex-1 p-6 rounded-xl text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 ${
        activeTab === tabName 
          ? 'bg-primary text-white shadow-lg' 
          : 'bg-white dark:bg-customGray-800 hover:shadow-lg shadow-md'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className={`text-lg font-semibold mb-2 ${
            activeTab === tabName 
              ? 'text-white' 
              : 'text-customGray-900 dark:text-customGray-100'
          }`}>
            {title}
          </h3>
          <div className={`text-sm ${
            activeTab === tabName 
              ? 'text-primary-light' 
              : 'text-customGray-600 dark:text-customGray-400'
          }`}>
            {summary}
          </div>
        </div>
        <div className="flex items-center ml-4">
          <svg
            className={`w-5 h-5 transition-transform duration-200 ${
              activeTab === tabName 
                ? 'rotate-180 text-white' 
                : 'text-customGray-400'
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
  );

  const renderExpandedContent = () => {
    if (!activeTab) return null;

    let content;
    
    if (activeTab === 'assets') {
      content = (
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
      );
    } else if (activeTab === 'taskTypes') {
      content = (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {taskTypeStats.map(({ taskType, count }) => (
            <div key={taskType} className="bg-white dark:bg-customGray-800 rounded-lg p-4 text-center shadow-sm">
              <h4 className="text-customGray-600 dark:text-customGray-400 text-sm font-medium mb-2 truncate" title={taskType}>
                {taskType}
              </h4>
              <div className="text-2xl font-bold text-customGray-900 dark:text-customGray-100">{count}</div>
            </div>
          ))}
        </div>
      );
    } else if (activeTab === 'completion') {
      content = (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {Object.entries(completionStats).map(([label, value]) => (
            <div key={label} className="bg-white dark:bg-customGray-800 rounded-lg p-4 text-center shadow-sm">
              <h3 className="text-customGray-600 dark:text-customGray-400 text-sm font-medium mb-2">{label}</h3>
              <div className="text-2xl font-bold text-customGray-900 dark:text-customGray-100">
                {isLoading ? '...' : value}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="mt-4 bg-customGray-50 dark:bg-customGray-700/50 rounded-xl p-6">
        {content}
      </div>
    );
  };

  return (
    <div className="mb-8">
      {/* Tab Headers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-0">
        {renderTabButton(
          'assets',
          'Asset Types',
          topAssets.length > 0 
            ? `Top: ${topAssets.map(a => `${a.assetType} (${a.count})`).join(', ')}${assetStats.length > 3 ? ` +${assetStats.length - 3} more` : ''}`
            : 'No asset data',
          assetStats.length
        )}
        
        {renderTabButton(
          'taskTypes',
          'Task Types',
          topTaskTypes.length > 0 
            ? `Top: ${topTaskTypes.map(t => `${t.taskType} (${t.count})`).join(', ')}${taskTypeStats.length > 3 ? ` +${taskTypeStats.length - 3} more` : ''}`
            : 'No task type data',
          taskTypeStats.length
        )}
        
        {renderTabButton(
          'completion',
          'Completion Rate',
          isLoading 
            ? 'Loading...'
            : totalCompleted > 0 
              ? `Fast (${fastestCount}) • Weekly (${weekCount}) • Slow (${slowestCount})`
              : 'No completion data',
          isLoading ? '...' : totalCompleted
        )}
      </div>

      {/* Expanded Content */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
        activeTab ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
      }`}>
        {renderExpandedContent()}
      </div>
    </div>
  );
} 