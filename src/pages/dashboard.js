import { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';
import { withAuth } from '@/lib/auth'; // HOC for page protection
import FilterPanel from '@/components/FilterPanel';
import TaskTable from '@/components/TaskTable';
import TaskSummary from '@/components/TaskSummary'; // Import TaskSummary component
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

function DashboardPage({ user }) { // User prop is passed by withAuth
  const [tasks, setTasks] = useState([]);
  const [distinctValues, setDistinctValues] = useState({ brands: [], assets: [], requesters: [], assignees: [], taskTypes: [] });
  const [filters, setFilters] = useState({ brand: '', asset: '', requester: '', assignee: [], taskType: [], startDate: '', endDate: '', completionFilter: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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
      setDistinctValues({ brands: [], assets: [], requesters: [], assignees: [], taskTypes: [] }); // Clear distinct values including taskTypes
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

    setIsLoading(true); // Show loading indicator during export
    setError('');

    // Format Filters Text
    const filtersApplied = Object.entries(filters)
      .filter(([key, value]) => value && (!Array.isArray(value) || value.length > 0))
      .map(([key, value]) => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${Array.isArray(value) ? value.join(', ') : value}`)
      .join('\n');

    // Get current date and time
    const now = new Date();
    const dateTimeString = now.toLocaleString();

    try {
      // Introduce a small delay to allow rendering to stabilize
      await new Promise(resolve => setTimeout(resolve, 100)); // e.g., 100ms delay

      console.log("Capturing content with html2canvas...");
      // Explicitly set background color on the container for capture consistency
      const originalStyle = chartContainer.style.backgroundColor;
      chartContainer.style.backgroundColor = '#ffffff';

      const canvas = await html2canvas(chartContainer, {
          scale: 1.5, // Keep scale for now
          useCORS: true,
          // Ensure we capture the full scrollable area
          width: chartContainer.scrollWidth,
          height: chartContainer.scrollHeight,
          // Removed backgroundColor option from here, rely on style change above
          windowWidth: chartContainer.scrollWidth, // Optional: Try explicitly setting window context width
          windowHeight: chartContainer.scrollHeight // Optional: Try explicitly setting window context height
      });

      // Restore original background color (if any)
      chartContainer.style.backgroundColor = originalStyle;

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
        // Restore original background color in case of error during canvas generation
        if (chartContainer) {
          chartContainer.style.backgroundColor = originalStyle; // Make sure to restore even on error
        }
        console.error("Error generating PDF:", err);
        setError(`Failed to generate PDF export: ${err.message || 'Unknown error'}`);
    } finally {
        setIsLoading(false); // Hide loading indicator
    }
  };

  // Helper to create clickable chart wrappers
  const renderClickableChart = (title, ChartComponent) => {
    // We need to pass tasks to the ChartComponent when rendering it inside the modal
    // The isFullscreen prop is passed automatically by the ChartModal component
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
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? 'Exporting...' : 'Export Charts to PDF'}
            </button>
        </div>

        {/* --- Exportable Content Area (Summary + Charts) --- */}
        {/* Attach the ref here to include TaskSummary and all charts */}
        <div ref={chartsContainerRef}>
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