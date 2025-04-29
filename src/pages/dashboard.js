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
import jsPDF from 'jspdf'; // Add jsPDF import
import html2canvas from 'html2canvas'; // Add html2canvas import
import CompletionRateSummary from '@/components/CompletionRateSummary';
// --- NEW IMPORTS ---
import AverageTimeInStatus from '@/components/AverageTimeInStatus'; 
import TaskStatusDurations from '@/components/TaskStatusDurations';
// --- END NEW IMPORTS ---
// --- NEW: Import for date formatting ---
import { format } from 'date-fns'; 

// Helper for date calculations
import { differenceInDays, parseISO } from 'date-fns'; // Removed unused date-fns imports

function DashboardPage({ user }) { // User prop is passed by withAuth
  const [tasks, setTasks] = useState([]);
  const [distinctValues, setDistinctValues] = useState({ brands: [], assets: [], requesters: [], assignees: [], taskTypes: [] });
  const [filters, setFilters] = useState({ brand: [], asset: [], requester: [], assignee: [], taskType: [], startDate: '', endDate: '', completionFilter: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isExporting, setIsExporting] = useState(false); // Add state for export loading

  // --- Sync State ---
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null); // Store timestamp or null
  const [syncMessage, setSyncMessage] = useState(''); // Feedback message
  // --- End Sync State ---

  // --- Calculated Metrics State --- 
  const [avgCycleTime, setAvgCycleTime] = useState(null);

  // --- Modal State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Store either chart content OR selected task ID for status view
  const [modalContent, setModalContent] = useState({ title: '', chart: null }); 
  const [selectedTaskId, setSelectedTaskId] = useState(null); // Track selected task for status duration modal
  // --- END Modal State ---

  const chartsContainerRef = useRef(null); // Add ref for chart container

  // Function to open modal for standard charts
  const openChartModal = (title, chartElement) => {
    setSelectedTaskId(null); // Ensure task ID is cleared
    setModalContent({ title, chart: chartElement });
    setIsModalOpen(true);
  };

  // --- NEW: Function to open modal for Task Status Durations ---
  const openTaskStatusModal = (taskId, taskName) => {
    setModalContent({ title: `Status History: ${taskName || taskId}`, chart: null }); // Set title, clear chart
    setSelectedTaskId(taskId); // Set the selected task ID
    setIsModalOpen(true);
  };
  // --- END NEW ---

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

  // Function to handle PDF export
  const handleExportPDF = async () => {
    console.log("Exporting PDF...");
    const chartContainer = chartsContainerRef.current;
    if (!chartContainer) {
      console.error("Chart container not found for export.");
      setError("Could not find elements to export.");
      return;
    }

    // Use dedicated export state, not general loading state
    setIsExporting(true);
    // setError(''); // Keep error state separate, don't clear it here necessarily

    // Format Filters Text
    const filtersApplied = Object.entries(filters)
      .filter(([key, value]) => value && (!Array.isArray(value) || value.length > 0))
      .map(([key, value]) => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${Array.isArray(value) ? value.join(', ') : value}`)
      .join('\n');

    // Get current date and time
    const now = new Date();
    const dateTimeString = now.toLocaleString();

    try {
      // Increase delay significantly
      await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay

      console.log("Capturing content with html2canvas...");

      // Get the inner wrapper element
      const captureElement = document.getElementById('capture-content');
      if (!captureElement) {
          console.error("Capture target element (#capture-content) not found.");
          setError("Could not find content element to export.");
          // Stop export loading indicator if element not found
          setIsExporting(false); 
          return;
      }

      // Temporarily set overflow to visible on the CAPTURE element
      const originalOverflow = captureElement.style.overflow;
      captureElement.style.overflow = 'visible';
      let originalHeight = captureElement.style.height;
      captureElement.style.height = 'auto'; // Ensure full height is considered

      let canvas;
      try {
          // Capture the INNER element
          canvas = await html2canvas(captureElement, {
              useCORS: true,
              backgroundColor: '#ffffff' // Use the built-in option for background
          });
      } finally {
          // Restore original styles on the CAPTURE element
          captureElement.style.overflow = originalOverflow;
          captureElement.style.height = originalHeight;
      }

      console.log("Canvas generated, converting to JPEG...");
      const imgData = canvas.toDataURL('image/jpeg', 0.8); // Use JPEG format with 80% quality
      
      console.log("Creating PDF...");
      const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'pt',
          format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 40; // points

      // --- PDF Content --- 
      let currentY = margin;

      // 1. Title
      pdf.setFontSize(16);
      pdf.setFont(undefined, 'bold'); // Use default font, but bold
      pdf.text("GGBC Reporting Dashboard", pdfWidth / 2, currentY, { align: 'center' });
      currentY += 15; // Add space after title

      // 2. Export Date/Time (smaller font, top right)
      pdf.setFontSize(8);
      pdf.setFont(undefined, 'normal'); // Reset font weight
      pdf.text(`Exported: ${dateTimeString}`, pdfWidth - margin, margin + 5, { align: 'right' }); // Position relative to top margin
      currentY += 10; // Add a bit more space

      // 3. Applied Filters
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'bold');
      pdf.text('Applied Filters:', margin, currentY);
      currentY += 15;
      pdf.setFont(undefined, 'normal');
      // Use splitTextToSize to handle potentially long filter lists
      const splitFilters = pdf.splitTextToSize(filtersApplied || 'None', pdfWidth - 2 * margin);
      pdf.text(splitFilters, margin, currentY);
      currentY += (splitFilters.length * 10) + 10; // Adjust Y based on number of lines for filters + spacing

      // 4. Chart Image
      const imageYPos = currentY;
      const imgProps = pdf.getImageProperties(imgData);
      const imgWidth = imgProps.width;
      const imgHeight = imgProps.height;
      const availableWidth = pdfWidth - 2 * margin;
      const availableHeight = pdfHeight - imageYPos - margin; 

      // Calculate scaling to fit image within available space
      let finalImgWidth = imgWidth;
      let finalImgHeight = imgHeight;
      const widthScale = availableWidth / finalImgWidth;
      const heightScale = availableHeight / finalImgHeight;
      const scale = Math.min(widthScale, heightScale); // Use the smaller scale to fit both dimensions

      finalImgWidth = imgWidth * scale;
      finalImgHeight = imgHeight * scale;
      
      // Center the image horizontally
      const imageXPos = margin + (availableWidth - finalImgWidth) / 2; 

      console.log("Adding image to PDF...");
      pdf.addImage(imgData, 'JPEG', imageXPos, imageYPos, finalImgWidth, finalImgHeight);

      // --- Save PDF --- 
      console.log("Saving PDF...");
      pdf.save(`GGBC_Dashboard_Export_${now.toISOString().split('T')[0]}.pdf`); // Add date to filename
      console.log("PDF Saved.");

    } catch (err) {
        console.error("Error generating PDF:", err);
        setError(`Failed to generate PDF export: ${err.message || 'Unknown error'}`);
        // Ensure overflow is restored on the CAPTURE element in case of errors
        if (captureElement && typeof originalOverflow !== 'undefined') { 
            captureElement.style.overflow = originalOverflow;
            captureElement.style.height = originalHeight;
        }
    } finally {
        // Hide EXPORT loading indicator
        setIsExporting(false); 
    }
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

  // --- NEW: Asana Sync Function ---
  const handleSyncNow = async () => {
    setIsSyncing(true);
    setSyncMessage('');
    setError(''); // Clear general errors before sync

    try {
      console.log("Attempting to call /api/sync-asana...");
      // Using GET, as POST might require a body even if empty, and GET is fine for triggers
      const res = await fetch('/api/sync-asana', { method: 'GET' }); 
      console.log("Sync API Response Status:", res.status);
      const data = await res.json();
      console.log("Sync API Response Data:", data);

      if (!res.ok) {
        throw new Error(data.message || `Sync failed with status: ${res.status}`);
      }

      setLastSyncTime(new Date()); // Record successful sync time
      setSyncMessage(data.message || 'Sync completed successfully!');
      
      // Optionally, refresh dashboard data after sync
      console.log("Sync successful, refreshing dashboard data...");
      initialFetch(); // Re-fetch all dashboard data

    } catch (err) {
      console.error('Error during manual Asana sync:', err);
      setSyncMessage(`Sync failed: ${err.message}`);
      setError(`Sync failed: ${err.message}`); // Also set general error if desired
      setLastSyncTime(null); // Indicate failure potentially
    } finally {
      setIsSyncing(false);
    }
  };
  // --- END Asana Sync Function ---

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

        {/* --- Sync Button and Info Section --- */}
        <div className="my-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
                <button
                    onClick={handleSyncNow}
                    disabled={isSyncing || isLoading} // Disable if loading data or syncing
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                    {isSyncing ? 'Syncing Asana Data...' : 'Sync Asana Data Now'}
                </button>
                {syncMessage && (
                    <p className={`mt-2 text-sm ${syncMessage.startsWith('Sync failed') ? 'text-red-600' : 'text-green-700'} dark:text-gray-300`}>
                        {syncMessage}
                    </p>
                )}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 text-right">
                {lastSyncTime ? (
                    `Last successful sync: ${format(lastSyncTime, 'PPpp')}` // Format date nicely
                ) : (
                    'Data has not been synced in this session.'
                )}
            </div>
        </div>
        {/* --- End Sync Button Section --- */}

        {/* Export Button */}
        <div className="my-4 text-right">
            <button
                onClick={handleExportPDF}
                disabled={isExporting || isLoading} 
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isExporting ? 'Exporting...' : 'Export Charts to PDF'}
            </button>
        </div>

        {/* Exportable Content Area */}
        <div ref={chartsContainerRef}>
          <div id="capture-content">
              {/* Task Summary Section */}
              {!error && (
                <TaskSummary 
                  tasks={tasks} 
                  avgCycleTime={avgCycleTime} 
                  isLoading={isLoading} 
                />
              )}

              {/* Average Time In Status Section */}
              {!isLoading && !error && (
                 <AverageTimeInStatus />
              )}

              {/* Chart Grid Section */}
              <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      {/* Re-added charts */}
                      <div className="lg:col-span-1">
                        {renderClickableChart('Task Completion Status', CompletionStatusChart)}
                      </div>
                      <div className="lg:col-span-1">
                        {renderClickableChart('Tasks by Deadline', TasksByDeadlineChart)}
                      </div>
                      <div className="lg:col-span-1">
                        {renderClickableChart('Tasks by Brand', TasksByBrandChart)}
                      </div>
                      <div className="lg:col-span-1">
                        {renderClickableChart('Tasks by Assignee', TasksByAssigneeChart)}
                      </div>
                      <div className="lg:col-span-1">
                        {renderClickableChart('Tasks by Asset Type', TasksByAssetChart)}
                      </div>
                      <div className="lg:col-span-1">
                        {renderClickableChart('Tasks by Requester', TasksByRequesterChart)}
                      </div>
                    </>
                  )}
              </div>

              {/* Line Chart Section */}
              <div className="mb-8">
                  {!isLoading && !error && tasks.length > 0 && (
                       renderClickableChart('Task Creation & Completion Trend', TaskTrendChart)
                  )} 
              </div>

              {/* Asset Summary Section */}
              {!isLoading && !error && tasks.length > 0 && (
                <AssetSummary tasks={tasks} />
              )}

              {/* Task Type Summary Section */}
              {!isLoading && !error && tasks.length > 0 && (
                <TaskTypeSummary tasks={tasks} />
              )}

              {/* Completion Rate Summary Section */}
              {!error && (
                <CompletionRateSummary tasks={tasks} isLoading={isLoading} />
              )}
          </div> { /* End #capture-content */}
        </div> { /* End chartsContainerRef */}

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

// Protect the page
export const getServerSideProps = withAuth();

export default DashboardPage; 