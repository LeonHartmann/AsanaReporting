import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { withAuth } from '@/lib/auth'; // HOC for page protection
import FilterPanel from '@/components/FilterPanel';
import TaskTable from '@/components/TaskTable';
import CompletionStatusChart from '@/components/charts/CompletionStatusChart'; // Import the chart
import TasksByBrandChart from '@/components/charts/TasksByBrandChart'; // Import the new chart
import TasksByAssigneeChart from '@/components/charts/TasksByAssigneeChart'; // Import the assignee chart
import TasksByAssetChart from '@/components/charts/TasksByAssetChart'; // Import the asset chart
import TaskCreationTrendChart from '@/components/charts/TaskCreationTrendChart'; // Import the line chart
import TasksByRequesterChart from '@/components/charts/TasksByRequesterChart'; // Import the requester chart
import ChartModal from '@/components/ChartModal'; // Import the modal

function DashboardPage({ user }) { // User prop is passed by withAuth
  const [tasks, setTasks] = useState([]);
  // Include assignees in distinct values state
  const [distinctValues, setDistinctValues] = useState({ brands: [], assets: [], requesters: [], assignees: [] }); 
  const [filters, setFilters] = useState({ brand: '', asset: '', requester: '' });
  const [isLoading, setIsLoading] = useState(true); // Start loading true
  const [error, setError] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', chart: null });

  const openModal = (title, chartElement) => {
    setModalContent({ title, chart: chartElement });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalContent({ title: '', chart: null }); // Clear content on close
  };

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

  // Helper to create clickable chart wrappers
  const renderClickableChart = (title, ChartComponent) => {
    // We need to pass tasks to the ChartComponent when rendering it inside the modal
    // Cloning the element allows us to pass the necessary props dynamically
    const chartElement = <ChartComponent tasks={tasks} />;
    return (
      <div className="cursor-pointer hover:shadow-lg transition-shadow duration-200 rounded-lg" onClick={() => openModal(title, chartElement)}>
         {/* Render the chart directly here for the dashboard view */}
         {chartElement}
      </div>
    );
  }

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
              {renderClickableChart('Task Completion Status', CompletionStatusChart)}
              {renderClickableChart('Tasks by Brand', TasksByBrandChart)}
              {renderClickableChart('Tasks by Assignee', TasksByAssigneeChart)}
              {renderClickableChart('Tasks by Asset Type', TasksByAssetChart)}
              {renderClickableChart('Tasks by Requester', TasksByRequesterChart)}
            </>
          )}
        </div>

        {/* --- Line Chart Section (Full Width) --- */} 
        <div className="mb-8"> 
           {!isLoading && !error && tasks.length > 0 && (
                renderClickableChart('Task Creation Trend', TaskCreationTrendChart)
           )} 
           {/* Optionally show loading/error specific to this chart if needed */} 
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

      {/* --- Modal --- */}
      <ChartModal isOpen={isModalOpen} onClose={closeModal} title={modalContent.title}>
        {/* Render the selected chart component inside the modal */} 
        {modalContent.chart}
      </ChartModal>
    </>
  );
}

// Protect the page using the withAuth HOC
export const getServerSideProps = withAuth();

export default DashboardPage; 