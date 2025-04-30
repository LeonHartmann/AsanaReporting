import { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';
import { withAuth } from '@/lib/auth'; // HOC for page protection
import FilterPanel from '@/components/FilterPanel';
import TaskTable from '@/components/TaskTable';
import TaskSummary from '@/components/TaskSummary'; // Import TaskSummary component
import AssetSummary from '@/components/AssetSummary'; // Import AssetSummary component
import TaskTypeSummary from '@/components/TaskTypeSummary'; // Import TaskTypeSummary component
import CompletionStatusChart from '@/components/charts/CompletionStatusChart'; // Import the chart
import TasksByBrandChart from '@/components/charts/TasksByBrandChart'; // Import the new chart
import TasksByAssigneeChart from '@/components/charts/TasksByAssigneeChart'; // Import the assignee chart
import TasksByAssetChart from '@/components/charts/TasksByAssetChart'; // Import the asset chart
import TaskTrendChart from '@/components/charts/TaskCreationTrendChart'; // Import the trend chart
import TasksByRequesterChart from '@/components/charts/TasksByRequesterChart'; // Import the requester chart
import ChartModal from '@/components/ChartModal'; // Import the modal
import TasksByDeadlineChart from '@/components/charts/TasksByDeadlineChart';
import CompletionRateSummary from '@/components/CompletionRateSummary';
// --- NEW IMPORTS ---
import AverageTimeInStatus from '@/components/AverageTimeInStatus';
import TaskStatusDurations from '@/components/TaskStatusDurations';
// --- END NEW IMPORTS ---
// --- NEW: Import for date formatting ---
import { format } from 'date-fns';
// --- NEW: Import Layout ---
import Layout from '@/components/Layout';
// --- NEW: Import CSV Export ---
import { exportTasksToCSV } from '@/utils/csvExport';
// --- NEW: Import PDF Export ---
import { exportDashboardToPDF } from '@/utils/pdfExport';

// Helper for date calculations
import { differenceInDays, parseISO } from 'date-fns'; // Removed unused date-fns imports

function DashboardPage({ user }) { // User prop is passed by withAuth
  const [tasks, setTasks] = useState([]);
  const [distinctValues, setDistinctValues] = useState({ brands: [], assets: [], requesters: [], assignees: [], taskTypes: [] });
  const [filters, setFilters] = useState({ brand: [], asset: [], requester: [], assignee: [], taskType: [], startDate: '', endDate: '', completionFilter: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  // State for managing PDF export loading indicator
  const [isExportingPDF, setIsExportingPDF] = useState(false); 

  // --- Calculated Metrics State ---
  const [avgCycleTime, setAvgCycleTime] = useState(null);

  // --- Modal State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Store either chart content OR selected task ID for status view
  const [modalContent, setModalContent] = useState({ title: '', chart: null }); 
  const [selectedTaskId, setSelectedTaskId] = useState(null); // Track selected task for status duration modal
  // --- END Modal State ---

  // Function to open modal for standard charts
  const openChartModal = (title, chartElement) => {
    setSelectedTaskId(null); // Ensure task ID is cleared
    setModalContent({ title, chart: chartElement });
    setIsModalOpen(true);
  };

  // --- Function to open modal for Task Status Durations ---
  const openTaskStatusModal = (taskId, taskName) => {
    setModalContent({ title: `Status History: ${taskName || taskId}`, chart: null }); // Set title, clear chart
    setSelectedTaskId(taskId); // Set the selected task ID
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalContent({ title: '', chart: null }); // Clear content on close
    setSelectedTaskId(null); // Clear selected task ID
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
      setDistinctValues(distinctData);

      // Fetch initial tasks
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
      setTasks([]);
      setDistinctValues({ brands: [], assets: [], requesters: [], assignees: [], taskTypes: [] });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch initial data on mount
  useEffect(() => {
    initialFetch();
  }, [initialFetch]);

  // --- Calculation Effects ---
  useEffect(() => {
    if (isLoading) return; // Wait for tasks to load

    // Filter completed tasks for Cycle Time
    const completedTasks = tasks.filter(t => t.completed && t.completedAt && t.createdAt);

    // Calculate Average Cycle Time (Days)
    if (completedTasks.length > 0) {
      const totalCycleTime = completedTasks.reduce((sum, task) => {
        try {
          const completedDate = parseISO(task.completedAt);
          const createdDate = parseISO(task.createdAt);
          const diff = differenceInDays(completedDate, createdDate);
          return sum + (diff >= 0 ? diff : 0);
        } catch (e) {
          console.warn("Error calculating cycle time for task:", task.id, e);
          return sum;
        }
      }, 0);
      setAvgCycleTime((totalCycleTime / completedTasks.length).toFixed(1));
    } else {
      setAvgCycleTime(null);
    }

  }, [tasks, isLoading]); // Removed stories and isLoadingStories dependencies

  // Function to fetch tasks based on current filters (used by FilterPanel)
  const fetchTasksWithFilters = useCallback(async (currentFilters) => {
    setIsLoading(true);
    setError('');
    
    const queryParams = new URLSearchParams();
    if (currentFilters.brand && currentFilters.brand.length > 0) {
        queryParams.append('brand', currentFilters.brand.join(','));
    }
    if (currentFilters.asset && currentFilters.asset.length > 0) {
        queryParams.append('asset', currentFilters.asset.join(','));
    }
    if (currentFilters.requester && currentFilters.requester.length > 0) {
        queryParams.append('requester', currentFilters.requester.join(','));
    }
    if (currentFilters.assignee && currentFilters.assignee.length > 0) {
        queryParams.append('assignee', currentFilters.assignee.join(','));
    }
    if (currentFilters.taskType && currentFilters.taskType.length > 0) {
        queryParams.append('taskType', currentFilters.taskType.join(','));
    }
    if (currentFilters.startDate) queryParams.append('startDate', currentFilters.startDate);
    if (currentFilters.endDate) queryParams.append('endDate', currentFilters.endDate);
    if (currentFilters.completionFilter) queryParams.append('completionFilter', currentFilters.completionFilter);
    
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
      const defaultFilters = { brand: [], asset: [], requester: [], assignee: [], taskType: [], startDate: '', endDate: '', completionFilter: 'all' };
      setFilters(defaultFilters);
      fetchTasksWithFilters(defaultFilters); // Fetch with default filters
  };

  // Helper to create clickable chart wrappers
  const renderClickableChart = (title, ChartComponent, dataProp) => {
    // Simplified: removed logic for activity/throughput data
    const chartProps = { [dataProp || 'tasks']: tasks }; 
    const chartElement = <ChartComponent {...chartProps} />;
    return (
      // Use openChartModal for standard charts
      <div className="cursor-pointer hover:shadow-lg transition-shadow duration-200 rounded-lg" onClick={() => openChartModal(title, <ChartComponent {...chartProps} isFullscreen />)}>
         {chartElement}
      </div>
    );
  }

  // Define the order of elements for PDF export
  const pdfElementIds = [
    'export-task-summary',
    'export-avg-time-status',
    // Add chart IDs individually if they should be separate images
    'export-completion-chart',
    'export-deadline-chart',
    'export-brand-chart',
    'export-assignee-chart',
    'export-asset-chart',
    'export-requester-chart',
    'export-trend-chart',
    'export-asset-summary',
    'export-task-type-summary',
    'export-completion-rate'
  ];

  return (
    <>
      <Head>
        <title>GGBC Reporting Dashboard</title>
      </Head>

      {/* Container for centered content (Filters, Summaries, Charts) */}
      <div className="container mx-auto px-2 md:px-4">
        <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">GGBC Reporting Dashboard</h2>

        {/* Filter Section */}
        <FilterPanel
          filters={filters}
          setFilters={setFilters}
          distinctValues={distinctValues}
          onApplyFilters={handleApplyFilters}
          onResetFilters={handleResetFilters}
        />

        {/* Export Buttons */} 
        <div className="my-4 text-right space-x-2"> {/* Added space-x-2 for button spacing */} 
            <button
                // Call the utility function, passing the element ID and necessary state setters
                onClick={() => exportDashboardToPDF(pdfElementIds, filters, setIsExportingPDF, setError)}
                disabled={isExportingPDF || isLoading} // Disable based on PDF export state
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isExportingPDF ? 'Exporting PDF...' : 'Export Charts to PDF'} 
            </button>
            {/* --- NEW CSV Export Button --- */}
            <button
                onClick={() => exportTasksToCSV(tasks, `GGBC_Tasks_Export_${format(new Date(), 'yyyy-MM-dd')}.csv`)} // Pass tasks and filename
                disabled={isLoading || tasks.length === 0} // Disable if loading or no tasks
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Export Tasks to CSV
            </button>
             {/* --- END NEW CSV Export Button --- */}
        </div>

        {/* Exportable Content Area (identified by id) */} 
        <div id="capture-content">
             {/* Task Summary Section */}
             <div id="export-task-summary">
                {!error && (
                  <TaskSummary 
                    tasks={tasks} 
                    avgCycleTime={avgCycleTime} 
                    isLoading={isLoading} 
                  />
                )} 
             </div>

             {/* Average Time In Status Section */}
             <div id="export-avg-time-status">
                {!isLoading && !error && (
                   <AverageTimeInStatus tasks={tasks} />
                )} 
             </div>

             {/* Chart Grid Section - Add ID to wrapper */}
             <div id="export-chart-grid" className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {isLoading && !tasks.length ? (
                  // Show a single loading indicator spanning columns if needed, or repeat per chart
                  <div className="lg:col-span-3 text-center py-10">Loading chart data...</div> 
                ) : error && !tasks.length ? (
                      <div className="lg:col-span-3 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                         Could not load chart data: {error}
                      </div>
                  ) : tasks.length === 0 ? (
                    <div className="lg:col-span-3 text-center py-10">No tasks match the current filters.</div>
                  ) : (
                    <> 
                      {/* Add IDs to individual chart wrappers */}
                     <div id="export-completion-chart" className="lg:col-span-1">
                        {renderClickableChart('Task Completion Status', CompletionStatusChart)}
                      </div>
                      <div id="export-deadline-chart" className="lg:col-span-1">
                         {renderClickableChart('Tasks by Deadline', TasksByDeadlineChart)}
                       </div>
                       <div id="export-brand-chart" className="lg:col-span-1">
                          {renderClickableChart('Tasks by Brand', TasksByBrandChart)}
                        </div>
                        <div id="export-assignee-chart" className="lg:col-span-1">
                           {renderClickableChart('Tasks by Assignee', TasksByAssigneeChart)}
                         </div>
                         <div id="export-asset-chart" className="lg:col-span-1">
                            {renderClickableChart('Tasks by Asset Type', TasksByAssetChart)}
                          </div>
                          <div id="export-requester-chart" className="lg:col-span-1">
                             {renderClickableChart('Tasks by Requester', TasksByRequesterChart)}
                           </div>
                    </>
                  )}
             </div>

             {/* Line Chart Section - Add ID */}
             <div id="export-trend-chart" className="mb-8">
                 {!isLoading && !error && tasks.length > 0 && (
                      renderClickableChart('Task Creation & Completion Trend', TaskTrendChart)
                 )} 
             </div>

             {/* Asset Summary Section - Add ID */}
             <div id="export-asset-summary">
                {!isLoading && !error && tasks.length > 0 && (
                  <AssetSummary tasks={tasks} />
                )}
             </div>

             {/* Task Type Summary Section - Add ID */}
             <div id="export-task-type-summary">
                {!isLoading && !error && tasks.length > 0 && (
                  <TaskTypeSummary tasks={tasks} />
                )}
             </div>

             {/* Completion Rate Summary Section - Add ID */}
             <div id="export-completion-rate">
                {!error && (
                  <CompletionRateSummary tasks={tasks} isLoading={isLoading} />
                )}
             </div>
         </div> { /* End #capture-content */} 

      </div> { /* --- End container for centered content --- */}

      {/* --- Task List Section - Moved OUTSIDE container for full width --- */}
      <div className="mt-8 px-2 md:px-4"> { /* Add margin and horizontal padding */}
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white container mx-auto">Task List</h2> { /* Keep title centered */ }
        <TaskTable 
          tasks={tasks} 
          isLoading={isLoading && tasks.length === 0} 
          error={error} 
          onRowClick={(task) => openTaskStatusModal(task.id, task.name)}
        />
      </div>
      {/* --- End Task List Section --- */}

      {/* Modal */}
      <ChartModal isOpen={isModalOpen} onClose={closeModal} title={modalContent.title}>
        {selectedTaskId ? (
          <TaskStatusDurations taskId={selectedTaskId} />
        ) : (
          modalContent.chart
        )}
      </ChartModal>
    </>
  );
}

// Set component display name for title in Layout
DashboardPage.displayName = 'GGBC Reporting Dashboard';

// Protect the page
export const getServerSideProps = withAuth();

export default DashboardPage; 