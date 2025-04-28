import React, { useMemo, useEffect, useState } from 'react';

export default function TaskSummary({ tasks }) {
  const [previousStats, setPreviousStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch previous period stats
  useEffect(() => {
    const fetchPreviousStats = async () => {
      setIsLoading(true);
      try {
        // Build query params based on current URL to preserve all active filters
        const currentUrl = new URL(window.location.href);
        const currentParams = currentUrl.searchParams;
        const queryParams = new URLSearchParams();
        
        // Add the previousPeriod flag
        queryParams.append('previousPeriod', 'true');
        
        // Preserve all other active filters from the current URL
        for (const [key, value] of currentParams.entries()) {
          if (key !== 'previousPeriod') { // Don't duplicate the previousPeriod param
            queryParams.append(key, value);
          }
        }
        
        // Fetch the data
        const res = await fetch(`/api/tasks?${queryParams.toString()}`);
        if (!res.ok) {
          throw new Error('Failed to fetch previous period data');
        }
        
        const previousTasks = await res.json();
        
        // Calculate stats for previous period
        if (previousTasks && previousTasks.length > 0) {
          // Current date for comparisons (normalized to start of day)
          const now = new Date();
          now.setDate(now.getDate() - 30); // Shift 30 days back for previous period comparison
          const prevToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          
          let prevOverdue = 0;
          let prevCompleted = 0;
          let prevIncomplete = 0;
          
          previousTasks.forEach(task => {
            if (task.completed) {
              prevCompleted++;
              return;
            }
            prevIncomplete++;
            
            if (!task.deadline) return;
            const deadlineDate = new Date(task.deadline);
            if (isNaN(deadlineDate.getTime())) return;
            const normalizedDeadline = new Date(
              deadlineDate.getFullYear(),
              deadlineDate.getMonth(),
              deadlineDate.getDate()
            );
            if (normalizedDeadline < prevToday) {
              prevOverdue++;
            }
          });
          
          setPreviousStats({
            completed: prevCompleted,
            incomplete: prevIncomplete,
            overdue: prevOverdue,
            total: previousTasks.length
          });
        }
      } catch (error) {
        console.error('Error fetching previous stats:', error);
        setPreviousStats(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPreviousStats();
  }, [tasks]); // Re-fetch when tasks change

  // Calculate task statistics
  const stats = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return { completed: 0, incomplete: 0, overdue: 0, total: 0 };
    }

    // Current date for comparisons (normalized to start of day)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let overdue = 0;
    let completed = 0;
    let incomplete = 0;

    tasks.forEach(task => {
      if (task.completed) {
        completed++;
        return;
      }
      incomplete++;
      // Use the same logic as TasksByDeadlineChart
      if (!task.deadline) return;
      const deadlineDate = new Date(task.deadline);
      if (isNaN(deadlineDate.getTime())) return;
      const normalizedDeadline = new Date(
        deadlineDate.getFullYear(),
        deadlineDate.getMonth(),
        deadlineDate.getDate()
      );
      if (normalizedDeadline < today) {
        overdue++;
      }
    });

    return {
      completed,
      incomplete,
      overdue,
      total: tasks.length
    };
  }, [tasks]);

  // Calculate percentage changes
  const percentChanges = useMemo(() => {
    if (!previousStats) return null;
    
    const calculatePercentChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };
    
    return {
      completed: calculatePercentChange(stats.completed, previousStats.completed),
      incomplete: calculatePercentChange(stats.incomplete, previousStats.incomplete),
      overdue: calculatePercentChange(stats.overdue, previousStats.overdue),
      total: calculatePercentChange(stats.total, previousStats.total)
    };
  }, [stats, previousStats]);

  // Helper function to render the change indicator
  const renderChangeIndicator = (percentChange, statType) => {
    if (percentChange === null) return null;
    
    const isPositive = percentChange > 0;
    const isZero = percentChange === 0;
    
    // Determine if the change is good (green) or bad (red)
    let isGood = false;
    
    if (statType === 'completed' || statType === 'total') {
      // For completed and total tasks, an increase is good
      isGood = isPositive;
    } else if (statType === 'incomplete' || statType === 'overdue') {
      // For incomplete and overdue tasks, a decrease is good
      isGood = !isPositive;
    }
    
    return (
      <div className={`text-xs font-medium flex items-center mt-1 ${isLoading ? 'opacity-50' : ''}`}>
        {isZero ? (
          <span className="text-gray-500">No change</span>
        ) : (
          <>
            <span className={`${isGood ? 'text-green-500' : 'text-red-500'} flex items-center`}>
              {isPositive ? (
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                </svg>
              ) : (
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                </svg>
              )}
              {Math.abs(percentChange)}%
            </span>
            <span className="ml-1 text-gray-500">vs prev 30d</span>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-4 gap-4 mb-8">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 text-center">
        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Completed tasks</h3>
        <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.completed}</div>
        {renderChangeIndicator(percentChanges?.completed, 'completed')}
      </div>
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 text-center">
        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Incomplete tasks</h3>
        <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.incomplete}</div>
        {renderChangeIndicator(percentChanges?.incomplete, 'incomplete')}
      </div>
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 text-center">
        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Overdue tasks</h3>
        <div className="text-3xl font-bold text-red-500">{stats.overdue}</div>
        {renderChangeIndicator(percentChanges?.overdue, 'overdue')}
      </div>
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 text-center">
        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Total tasks</h3>
        <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
        {renderChangeIndicator(percentChanges?.total, 'total')}
      </div>
    </div>
  );
} 