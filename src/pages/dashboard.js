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

// New Metric Charts
import ProjectActivityChart from '@/components/charts/ProjectActivityChart';
import TaskThroughputChart from '@/components/charts/TaskThroughputChart';

// Helper for date calculations (consider moving to a utils file)
import { differenceInDays, parseISO, format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

function DashboardPage({ user }) { // User prop is passed by withAuth
  const [tasks, setTasks] = useState([]);
  const [stories, setStories] = useState([]); // <-- Add state for stories
  const [distinctValues, setDistinctValues] = useState({ brands: [], assets: [], requesters: [], assignees: [], taskTypes: [] });
  const [filters, setFilters] = useState({ brand: '', asset: '', requester: '', assignee: [], taskType: [], startDate: '', endDate: '', completionFilter: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStories, setIsLoadingStories] = useState(true); // <-- Add separate loading state for stories
  const [error, setError] = useState('');
  const [isExporting, setIsExporting] = useState(false); // Add state for export loading

  // --- Calculated Metrics State --- 
  const [projectActivityData, setProjectActivityData] = useState([]);
  const [taskThroughputData, setTaskThroughputData] = useState([]);
  const [avgCycleTime, setAvgCycleTime] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', chart: null });

  const chartsContainerRef = useRef(null); // Add ref for chart container

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
    setIsLoadingStories(true); // <-- Set stories loading
    setError('');
    try {
      // Fetch distinct values
      const distinctRes = await fetch('/api/tasks?distinct=true');
      if (!distinctRes.ok) {
        throw new Error(`Failed to fetch distinct values: ${distinctRes.statusText}`);
      }
      const distinctData = await distinctRes.json();
      setDistinctValues(distinctData); // Update distinct values including assignees and taskTypes

      // Fetch initial tasks (no filters applied yet)
      const tasksRes = await fetch('/api/tasks'); // Fetch tasks without initial completion filter
      if (!tasksRes.ok) {
        const errorData = await tasksRes.json();
        throw new Error(errorData.message || `Failed to fetch tasks: ${tasksRes.statusText}`);
      }
      const tasksData = await tasksRes.json();
      setTasks(tasksData);

      // --- Fetch Stories ---
      const storiesRes = await fetch('/api/stories');
      if (!storiesRes.ok) {
        const errorData = await storiesRes.json();
        throw new Error(errorData.message || `Failed to fetch stories: ${storiesRes.statusText}`);
      }
      const storiesData = await storiesRes.json();
      setStories(storiesData);
      setIsLoadingStories(false); // <-- Finish stories loading

    } catch (err) {
      console.error('Error during initial fetch:', err);
      setError(err.message || 'Could not load dashboard data. Please refresh.');
      setTasks([]); // Clear tasks on error
      setStories([]); // <-- Clear stories on error
      setDistinctValues({ brands: [], assets: [], requesters: [], assignees: [], taskTypes: [] }); // Clear distinct values including taskTypes
      setIsLoadingStories(false); // <-- Finish stories loading even on error
    } finally {
      setIsLoading(false); // Keep this for overall loading state
    }
  }, []);

  // Fetch initial data on mount
  useEffect(() => {
    initialFetch();
  }, [initialFetch]);

  // --- Calculation Effects ---
  useEffect(() => {
    if (isLoading || isLoadingStories) return; // Wait for both tasks and stories to load

    // 1. Calculate Project Activity (Weekly)
    const weeklyActivity = {};
    stories.forEach(story => {
      try {
        const date = parseISO(story.createdAt);
        const weekStart = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd'); // Monday as start
        weeklyActivity[weekStart] = (weeklyActivity[weekStart] || 0) + 1;
      } catch (e) {
        console.warn("Invalid story date:", story.createdAt);
      }
    });
    const activityChartData = Object.entries(weeklyActivity)
      .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
      .map(([date, count]) => ({ date, count }));
    setProjectActivityData(activityChartData);

    // Filter completed tasks for Throughput and Cycle Time
    const completedTasks = tasks.filter(t => t.completed && t.completedAt && t.createdAt);

    // 2. Calculate Task Throughput (Monthly)
    const monthlyThroughput = {};
    completedTasks.forEach(task => {
      try {
        const date = parseISO(task.completedAt);
        const monthStart = format(startOfMonth(date), 'yyyy-MM');
        monthlyThroughput[monthStart] = (monthlyThroughput[monthStart] || 0) + 1;
      } catch (e) {
        console.warn("Invalid completedAt date:", task.completedAt);
      }
    });
    const throughputChartData = Object.entries(monthlyThroughput)
      .sort(([dateA], [dateB]) => new Date(dateA + '-01') - new Date(dateB + '-01')) // Sort by month
      .map(([month, count]) => ({ month, count }));
    setTaskThroughputData(throughputChartData);

    // 3. Calculate Average Cycle Time (Days)
    if (completedTasks.length > 0) {
      const totalCycleTime = completedTasks.reduce((sum, task) => {
        try {
          const completedDate = parseISO(task.completedAt);
          const createdDate = parseISO(task.createdAt);
          const diff = differenceInDays(completedDate, createdDate);
          return sum + (diff >= 0 ? diff : 0); // Avoid negative cycle times
        } catch (e) {
          console.warn("Error calculating cycle time for task:", task.id, e);
          return sum;
        }
      }, 0);
      setAvgCycleTime((totalCycleTime / completedTasks.length).toFixed(1));
    } else {
      setAvgCycleTime(null); // No completed tasks
    }

  }, [tasks, stories, isLoading, isLoadingStories]);

  // Function to fetch tasks based on current filters (used by FilterPanel)
  const fetchTasksWithFilters = useCallback(async (currentFilters) => {
    setIsLoading(true);
    setError('');
    
    const queryParams = new URLSearchParams();
    if (currentFilters.brand) queryParams.append('brand', currentFilters.brand);
    if (currentFilters.asset) queryParams.append('asset', currentFilters.asset);
    if (currentFilters.requester) queryParams.append('requester', currentFilters.requester);
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
      const defaultFilters = { brand: '', asset: '', requester: '', assignee: [], taskType: [], startDate: '', endDate: '', completionFilter: 'all' };
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
    // Use a consistent prop name like 'chartData' or pass specific props
    const chartProps = { [dataProp || 'tasks']: dataProp === 'activityData' ? projectActivityData : (dataProp === 'throughputData' ? taskThroughputData : tasks) };
    const chartElement = <ChartComponent {...chartProps} />;
    return (
      <div className="cursor-pointer hover:shadow-lg transition-shadow duration-200 rounded-lg" onClick={() => openModal(title, <ChartComponent {...chartProps} isFullscreen />)}>
         {/* Render the chart directly here for the dashboard view */}
         {chartElement}
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>GGBC Reporting Dashboard</title>
      </Head>
      <div className="container mx-auto px-2 md:px-4">
        <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">GGBC Reporting Dashboard</h2>

        {/* --- Moved Filter Section --- */}
        <FilterPanel
          filters={filters}
          setFilters={setFilters}
          distinctValues={distinctValues} // Pass distinct values (including assignees and taskTypes)
          onApplyFilters={handleApplyFilters}
          onResetFilters={handleResetFilters} // Pass reset handler
        />

        {/* Add Export Button */}
        <div className="my-4 text-right">
            <button
                onClick={handleExportPDF}
                disabled={isExporting || isLoading} // Disable if exporting OR loading data
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isExporting ? 'Exporting...' : 'Export Charts to PDF'} {/* Use isExporting for text */}
            </button>
        </div>

        {/* --- Exportable Content Area (Summary + Charts) --- */}
        {/* Outer div still uses the ref */}
        <div ref={chartsContainerRef}>
          {/* Inner wrapper div for actual capture target */}
          <div id="capture-content">
              {/* Task Summary Section */} 
              {!isLoading && !error && tasks.length > 0 && (
                <TaskSummary tasks={tasks} />
              )}

              {/* --- Chart Grid Section --- */} 
              <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"> {/* Adjusted gap to be smaller */}
              {isLoading && !tasks.length ? (
                  // Show a single loading indicator spanning columns if needed, or repeat per chart
                  <div className="lg:col-span-3 text-center py-10">Loading chart data...</div> 
              ) : error && !tasks.length ? (
                   <div className="lg:col-span-3 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                      Could not load chart data: {error}
                   </div>
                ) : (
                  <>
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

              {/* --- Line Chart Section (Full Width) --- */} 
              <div className="mb-8"> 
                 {!isLoading && !error && tasks.length > 0 && (
                      renderClickableChart('Task Creation & Completion Trend', TaskTrendChart)
                 )} 
                 {/* Optionally show loading/error specific to this chart if needed */} 
              </div>

              {/* --- Asset Summary Section --- */}
              {!isLoading && !error && tasks.length > 0 && (
                <AssetSummary tasks={tasks} />
              )}

              {/* --- Task Type Summary Section --- */}
              {!isLoading && !error && tasks.length > 0 && (
                <TaskTypeSummary tasks={tasks} />
              )}

              {/* ----- End Main Summary Cards ----- */}

              {/* ----- Section for New Metrics ----- */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Average Cycle Time Card */}
                <div className="bg-white p-4 rounded-lg shadow flex flex-col justify-center items-center h-full">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Avg. Cycle Time</h3>
                  <p className="text-2xl font-semibold">
                    {isLoading ? '...' : (avgCycleTime !== null ? `${avgCycleTime} days` : 'N/A')}
                  </p>
                  <span className="text-xs text-gray-400">(All Completed Tasks)</span>
                </div>
                 {/* Project Activity Chart */}
                <div className="col-span-1 md:col-span-1">
                  <h3 className="text-sm font-medium text-gray-500 mb-2 text-center">Project Activity (Weekly)</h3>
                  {isLoadingStories ? (
                    <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-md h-64 md:h-full flex items-center justify-center text-gray-500">Loading...</div>
                  ) : (
                    renderClickableChart('Project Activity Trend (Weekly)', ProjectActivityChart, 'activityData')
                  )}
                </div>
                 {/* Task Throughput Chart */}
                <div className="col-span-1 md:col-span-1">
                  <h3 className="text-sm font-medium text-gray-500 mb-2 text-center">Task Throughput (Monthly)</h3>
                  {isLoading ? (
                    <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-md h-64 md:h-full flex items-center justify-center text-gray-500">Loading...</div>
                  ) : (
                    renderClickableChart('Task Throughput (Monthly)', TaskThroughputChart, 'throughputData')
                  )}
                </div>
              </div>
              {/* ----- End Section for New Metrics ----- */}
          </div> {/* End inner wrapper #capture-content */}
        </div> {/* End of chartsContainerRef / Exportable Content div */}

        {/* --- Filter and Table Section --- */}
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Task List</h2>
        
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