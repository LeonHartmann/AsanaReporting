import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { withAuth } from '@/lib/auth'; // HOC for page protection
import FilterPanel from '@/components/FilterPanel';
import TaskTable from '@/components/TaskTable';
import CompletionStatusChart from '@/components/charts/CompletionStatusChart'; // Import the chart
import TasksByBrandChart from '@/components/charts/TasksByBrandChart'; // Import the new chart

function DashboardPage({ user }) { // User prop is passed by withAuth
  const [tasks, setTasks] = useState([]);
  // Include assignees in distinct values state
  const [distinctValues, setDistinctValues] = useState({ brands: [], assets: [], requesters: [], assignees: [] }); 
  const [filters, setFilters] = useState({ brand: '', asset: '', requester: '' });
  const [isLoading, setIsLoading] = useState(true); // Start loading true
  const [error, setError] = useState('');

  // Combined fetch function for both distinct values and initial tasks
  const initialFetch = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      // Fetch distinct values
      const distinctRes = await fetch('/api/tasks?distinct=true');
      if (!distinctRes.ok) {
        throw new Error(`Failed to fetch distinct values: ${distinctRes.statusText}`);
      }
      const distinctData = await distinctRes.json();
      setDistinctValues(distinctData); // Update distinct values including assignees

      // Fetch initial tasks (no filters applied yet)
      const tasksRes = await fetch('/api/tasks');
      if (!tasksRes.ok) {
        const errorData = await tasksRes.json();
        throw new Error(errorData.message || `Failed to fetch tasks: ${tasksRes.statusText}`);
      }
      const tasksData = await tasksRes.json();
      setTasks(tasksData);

    } catch (err) {
      console.error('Error during initial fetch:', err);
      setError(err.message || 'Could not load dashboard data. Please refresh.');
      setTasks([]); // Clear tasks on error
      setDistinctValues({ brands: [], assets: [], requesters: [], assignees: [] }); // Clear distinct values
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch initial data on mount
  useEffect(() => {
    initialFetch();
  }, [initialFetch]);


  // Function to fetch tasks based on current filters (used by FilterPanel)
  const fetchTasksWithFilters = useCallback(async (currentFilters) => {
    setIsLoading(true);
    setError('');
    
    const queryParams = new URLSearchParams();
    if (currentFilters.brand) queryParams.append('brand', currentFilters.brand);
    if (currentFilters.asset) queryParams.append('asset', currentFilters.asset);
    if (currentFilters.requester) queryParams.append('requester', currentFilters.requester);
    // Note: We are not filtering by assignee yet in the UI, but could add it here
    
    const url = `/api/tasks?${queryParams.toString()}`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || `Failed to fetch tasks: ${res.statusText}`);
      }
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error('Error fetching filtered tasks:', err);
      setError(err.message || 'Could not load tasks with current filters.');
      setTasks([]); // Clear tasks on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handler for applying filters from the panel
  const handleApplyFilters = (newFilters = filters) => {
    setFilters(newFilters); // Update local filter state
    fetchTasksWithFilters(newFilters);
  };
  
  // Handler for resetting filters
  const handleResetFilters = () => {
      const defaultFilters = { brand: '', asset: '', requester: '' };
      setFilters(defaultFilters);
      fetchTasksWithFilters(defaultFilters); // Fetch with default filters
  };

  return (
    <>
      <Head>
        <title>Dashboard - Asana Tasks</title>
      </Head>
      <div>
        <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">Asana Reporting</h2>
        
        {/* --- Reporting Section --- */} 
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6"> {/* Use grid layout */}
          {isLoading && !tasks.length ? (
             // Show a single loading indicator spanning columns if needed, or repeat per chart
             <div className="md:col-span-2 text-center py-10">Loading chart data...</div> 
          ) : error && !tasks.length ? (
             <div className="md:col-span-2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                Could not load chart data: {error}
             </div>
          ) : (
            <>
              {/* Render Completion Chart */} 
              <CompletionStatusChart tasks={tasks} /> 
              {/* Render Brand Chart */} 
              <TasksByBrandChart tasks={tasks} />
            </>
          )}
        </div>

        {/* --- Filter and Table Section --- */}
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Task List</h2>
        
        <FilterPanel 
          filters={filters} 
          setFilters={setFilters} 
          distinctValues={distinctValues} // Pass distinct values (including assignees)
          onApplyFilters={handleApplyFilters} 
          onResetFilters={handleResetFilters} // Pass reset handler
        />

        <TaskTable 
          tasks={tasks} 
          isLoading={isLoading && tasks.length === 0} // Show table loading only if tasks array is empty during load
          error={error} 
        />
      </div>
    </>
  );
}

// Protect the page using the withAuth HOC
export const getServerSideProps = withAuth();

export default DashboardPage; 