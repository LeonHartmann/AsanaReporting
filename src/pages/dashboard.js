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
// --- NEW: Import Settings Modal ---
import PdfExportSettingsModal from '@/components/PdfExportSettingsModal';
// --- NEW: Import Settings Icon (example using a basic SVG, replace if you have an icon library) ---
import { SettingsIcon } from '@/components/icons'; // Assuming you have an icons component/file

// Helper for date calculations
import { differenceInDays, parseISO } from 'date-fns'; // Removed unused date-fns imports

// --- Define exportable elements with user-friendly names ---
const availablePdfElements = [
  { id: 'export-task-summary', name: 'Task Summary' },
  { id: 'export-avg-time-status', name: 'Average Time In Status' },
  { id: 'export-completion-chart', name: 'Completion Status Chart' },
  { id: 'export-deadline-chart', name: 'Deadline Chart' },
  { id: 'export-brand-chart', name: 'Brand Chart' },
  { id: 'export-assignee-chart', name: 'Assignee Chart' },
  { id: 'export-asset-chart', name: 'Asset Type Chart' },
  { id: 'export-requester-chart', name: 'Requester Chart' },
  { id: 'export-trend-chart', name: 'Trend Chart' },
  { id: 'export-asset-summary', name: 'Asset Summary Table' },
  { id: 'export-task-type-summary', name: 'Task Type Summary Table' },
  { id: 'export-completion-rate', name: 'Completion Rate Summary' }
];
// Extract just the IDs for initial state
const allPdfElementIds = availablePdfElements.map(el => el.id);

function DashboardPage({ user }) { // User prop is passed by withAuth
  const [tasks, setTasks] = useState([]);
  const [distinctValues, setDistinctValues] = useState({ brands: [], assets: [], requesters: [], assignees: [], taskTypes: [] });
  const [filters, setFilters] = useState({ brand: [], asset: [], requester: [], assignee: [], taskType: [], startDate: '', endDate: '', completionFilter: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  // State for managing PDF export loading indicator
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // --- NEW: PDF Export Settings State ---
  const [isPdfSettingsModalOpen, setIsPdfSettingsModalOpen] = useState(false);
  const [selectedPdfElementIds, setSelectedPdfElementIds] = useState(allPdfElementIds); // Default to all selected

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
    const chartElement = <ChartComponent {...chartProps} />; // isFullscreen is handled by the ChartModal now for the actual chart content
    return (
      <div 
        className="cursor-pointer bg-white dark:bg-customGray-800 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.015] transition-all duration-200 ease-in-out h-full flex flex-col" // Added bg, rounded-xl, shadow-lg, hover:shadow-xl, hover:scale, h-full, flex
        onClick={() => openChartModal(title, <ChartComponent {...chartProps} isFullscreen />)} // Pass the chart with isFullscreen for the modal
      >
         <div className="flex-grow p-1"> {/* Added padding for content within card if any, and flex-grow */}
            {chartElement}
        </div>
      </div>
    );
  }

  // Define the order of elements for PDF export
  // --- This is now defined outside the component ---
  /*
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
  */

  return (
    <>
      <Head>
        <title>GGBC Reporting Dashboard</title>
      </Head>

      {/* Wrapper for dashboard content. Padding is now handled by Layout.js <main> tag. */}
      <div>
        <h2 className="text-2xl font-semibold mb-6 text-customGray-900 dark:text-customGray-100">GGBC Reporting Dashboard</h2>

        {/* Filter Section */}
        <FilterPanel
          filters={filters}
          setFilters={setFilters}
          distinctValues={distinctValues}
          onApplyFilters={handleApplyFilters}
          onResetFilters={handleResetFilters}
        />

        {/* Export Buttons */}
        <div className="my-4 text-right flex justify-end items-center space-x-2"> {/* Use flex for alignment */}
            {/* CSV Export Button */}
            <button
                onClick={() => exportTasksToCSV(tasks, `GGBC_Tasks_Export_${format(new Date(), 'yyyy-MM-dd')}.csv`)}
                disabled={isLoading || tasks.length === 0}
                className="px-4 py-2 bg-secondary hover:bg-secondary-dark text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-light disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150"
            >
                Export Tasks to CSV
            </button>
            
            {/* PDF Export Button */}
            <button
                onClick={() => exportDashboardToPDF(selectedPdfElementIds, filters, setIsExportingPDF, setError)}
                disabled={isExportingPDF || isLoading || selectedPdfElementIds.length === 0}
                className="flex items-center justify-center px-4 py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150"
                title={selectedPdfElementIds.length === 0 ? "Select elements to export via settings" : "Export selected charts to PDF"}
            >
                {isExportingPDF ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Exporting PDF...
                  </>
                ) : (
                  'Export Charts to PDF'
                )}
            </button>
            
            {/* PDF Settings Button */}
            <button
                onClick={() => setIsPdfSettingsModalOpen(true)}
                className="p-2.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150"
                title="Configure PDF Export"
                disabled={isLoading}
            >
                <SettingsIcon className="w-5 h-5" />
            </button>
        </div>

        {/* Exportable Content Area (identified by id) */} 
        <div id="capture-content">
             {/* Task Summary Section */}
             <div id="export-task-summary" className="max-w-screen-2xl mx-auto">
                {!error && (
                  <TaskSummary 
                    tasks={tasks} 
                    avgCycleTime={avgCycleTime} 
                    isLoading={isLoading} 
                  />
                )} 
             </div>

             {/* Average Time In Status Section - This component might be better full-width or have its own internal max-width if needed */}
             <div id="export-avg-time-status" className="max-w-screen-2xl mx-auto">
                {!isLoading && !error && (
                   <AverageTimeInStatus tasks={tasks} />
                )} 
             </div>

             {/* Chart Grid Section - Add ID to wrapper */}
             <div id="export-chart-grid" className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-screen-2xl mx-auto"> {/* Increased gap & added max-width */}
                 {isLoading && !tasks.length && !error ? (
                  <div className="lg:col-span-3 text-center py-12 text-customGray-500 dark:text-customGray-400 font-medium">
                    <div className="flex justify-center items-center">
                      <svg className="animate-spin h-6 w-6 text-primary mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading chart data...
                    </div>
                  </div> 
                ) : error && !tasks.length ? (
                      <div className="lg:col-span-3 bg-error/10 border border-error/40 text-error px-4 py-3 rounded-lg relative font-sans" role="alert">
                         <strong className="font-bold">Error!</strong> Could not load chart data: {error}
                      </div>
                  ) : !isLoading && tasks.length === 0 && !error ? (
                    <div className="lg:col-span-3 text-center py-12 text-customGray-500 dark:text-customGray-400 font-medium">No tasks match the current filters.</div>
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
             <div id="export-trend-chart" className="mb-8 max-w-screen-2xl mx-auto"> {/* Added max-width */}
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

      </div> {/* --- End wrapper for dashboard content --- */}

      {/* --- Task List Section - Moved OUTSIDE container for full width --- */}
      <div className="mt-8"> {/* Horizontal padding is now handled by Layout.js <main> tag */}
        <h2 className="text-2xl font-semibold mb-4 text-customGray-900 dark:text-customGray-100 container mx-auto">Task List</h2> {/* Keep title centered */}
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

      {/* --- NEW: PDF Export Settings Modal --- */}
      {/* Render the modal conditionally */}
      <PdfExportSettingsModal
        isOpen={isPdfSettingsModalOpen}
        onClose={() => setIsPdfSettingsModalOpen(false)}
        availableElements={availablePdfElements}
        selectedElementIds={selectedPdfElementIds}
        onSave={(newSelection) => {
          setSelectedPdfElementIds(newSelection);
          setIsPdfSettingsModalOpen(false);
        }}
      />
    </>
  );
}

// Set component display name for title in Layout
DashboardPage.displayName = 'GGBC Reporting Dashboard';

// Protect the page
export const getServerSideProps = withAuth();

export default DashboardPage; 