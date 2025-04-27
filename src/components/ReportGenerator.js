import { useState } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const ReportGenerator = ({ tasks, distinctValues }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      // Create a new PDF document
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10; // margin in mm
      
      // Add title and logo (if available)
      pdf.setFontSize(24);
      pdf.setTextColor(21, 101, 192); // Blue color for title
      pdf.text('SPORTFIVE', pageWidth / 2, 20, { align: 'center' });
      
      pdf.setFontSize(20);
      pdf.setTextColor(0, 0, 0); // Black text for subtitle
      pdf.text('Executive Asana Task Report', pageWidth / 2, 30, { align: 'center' });
      
      // Add date and time
      const currentDate = new Date().toLocaleDateString();
      const currentTime = new Date().toLocaleTimeString();
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100); // Gray color for date
      pdf.text(`Generated on: ${currentDate} at ${currentTime}`, pageWidth / 2, 40, { align: 'center' });
      
      // Add a divider line
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, 45, pageWidth - margin, 45);
      
      // Add summary section title
      pdf.setFontSize(16);
      pdf.setTextColor(33, 33, 33);
      pdf.text('EXECUTIVE SUMMARY', margin, 55);
      
      // Summary statistics
      pdf.setFontSize(12);
      pdf.setTextColor(80, 80, 80);
      
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(task => task.completed).length;
      const incompleteTasks = totalTasks - completedTasks;
      const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0;
      
      const currentMonth = new Date().toLocaleString('default', { month: 'long' });
      const currentYear = new Date().getFullYear();
      
      pdf.text(`Report Period: ${currentMonth} ${currentYear}`, margin, 63);
      pdf.text(`Total Tasks: ${totalTasks}`, margin, 71);
      pdf.text(`Completed Tasks: ${completedTasks} (${completionRate}%)`, margin, 79);
      pdf.text(`Incomplete Tasks: ${incompleteTasks}`, margin, 87);

      // Count tasks by brand if available
      if (distinctValues && distinctValues.brands && distinctValues.brands.length > 0) {
        const topBrand = distinctValues.brands[0];
        const brandTaskCount = tasks.filter(task => task.brand === topBrand).length;
        pdf.text(`Top Brand: ${topBrand} (${brandTaskCount} tasks)`, margin, 95);
      }
      
      // Add a divider line
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, 105, pageWidth - margin, 105);
      
      // Add charts section title
      pdf.setFontSize(16);
      pdf.setTextColor(33, 33, 33);
      pdf.text('KEY PERFORMANCE INDICATORS', margin, 115);
      
      // Array of chart IDs with their titles
      const chartInfo = [
        { id: 'completion-status-chart', title: 'Task Completion Status' },
        { id: 'tasks-by-deadline-chart', title: 'Tasks by Deadline' },
        { id: 'tasks-by-brand-chart', title: 'Tasks by Brand' },
        { id: 'tasks-by-assignee-chart', title: 'Tasks by Assignee' },
        { id: 'tasks-by-asset-chart', title: 'Tasks by Asset Type' },
        { id: 'tasks-by-requester-chart', title: 'Tasks by Requester' },
        { id: 'task-creation-trend-chart', title: 'Task Creation Trend' }
      ];
      
      let yPosition = 125;
      let chartCount = 0;
      
      // Handle charts in a 2-column layout
      for (let i = 0; i < chartInfo.length; i += 2) {
        // Check if we need a new page
        if (yPosition + 80 > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin + 10;
        }
        
        // Process first chart in the row
        const chart1 = document.getElementById(chartInfo[i].id);
        if (chart1) {
          try {
            // Convert chart to canvas
            const canvas1 = await html2canvas(chart1, {
              scale: 2,
              logging: false,
              useCORS: true,
              backgroundColor: '#ffffff',
              // Set a specific width to ensure consistency
              width: 400
            });
            
            // Calculate dimensions
            const imgWidth1 = (pageWidth - (margin * 3)) / 2; // Half width minus margins
            const imgHeight1 = (canvas1.height * imgWidth1) / canvas1.width;
            
            // Add chart title
            pdf.setFontSize(12);
            pdf.setTextColor(33, 33, 33);
            pdf.text(chartInfo[i].title, margin, yPosition);
            
            // Add image
            const imgData1 = canvas1.toDataURL('image/png');
            pdf.addImage(imgData1, 'PNG', margin, yPosition + 5, imgWidth1, imgHeight1);
            
            chartCount++;
          } catch (err) {
            console.error(`Error processing chart ${chartInfo[i].id}:`, err);
          }
        }
        
        // Process second chart in the row (if exists)
        if (i + 1 < chartInfo.length) {
          const chart2 = document.getElementById(chartInfo[i + 1].id);
          if (chart2) {
            try {
              // Convert chart to canvas
              const canvas2 = await html2canvas(chart2, {
                scale: 2,
                logging: false,
                useCORS: true,
                backgroundColor: '#ffffff',
                width: 400
              });
              
              // Calculate dimensions and position
              const imgWidth2 = (pageWidth - (margin * 3)) / 2; // Half width minus margins
              const imgHeight2 = (canvas2.height * imgWidth2) / canvas2.width;
              const xPosition2 = margin * 2 + imgWidth2; // Position after first chart + margin
              
              // Add chart title
              pdf.setFontSize(12);
              pdf.setTextColor(33, 33, 33);
              pdf.text(chartInfo[i + 1].title, xPosition2, yPosition);
              
              // Add image
              const imgData2 = canvas2.toDataURL('image/png');
              pdf.addImage(imgData2, 'PNG', xPosition2, yPosition + 5, imgWidth2, imgHeight2);
              
              chartCount++;
            } catch (err) {
              console.error(`Error processing chart ${chartInfo[i+1].id}:`, err);
            }
          }
        }
        
        // Update y-position for next row of charts
        // Use max height from both charts or default height if charts not found
        const maxImgHeight = 75; // default height if charts not rendered
        yPosition += maxImgHeight + 15;
      }
      
      // Special handling for the trend chart (full width)
      const trendChart = document.getElementById('task-creation-trend-chart');
      if (trendChart) {
        // Check if we need a new page
        if (yPosition + 80 > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin + 10;
        }
        
        try {
          // Convert chart to canvas
          const trendCanvas = await html2canvas(trendChart, {
            scale: 2,
            logging: false,
            useCORS: true,
            backgroundColor: '#ffffff',
            width: 800
          });
          
          // Calculate dimensions for full width
          const imgWidth = pageWidth - (margin * 2);
          const imgHeight = (trendCanvas.height * imgWidth) / trendCanvas.width;
          
          // Add chart title
          pdf.setFontSize(14);
          pdf.setTextColor(33, 33, 33);
          pdf.text('Task Creation Trend Over Time', margin, yPosition);
          
          // Add image
          const imgData = trendCanvas.toDataURL('image/png');
          pdf.addImage(imgData, 'PNG', margin, yPosition + 5, imgWidth, imgHeight);
          
          yPosition += imgHeight + 20;
          chartCount++;
        } catch (err) {
          console.error('Error processing trend chart:', err);
        }
      }
      
      // Add a page for task list summary if we have tasks
      if (tasks.length > 0) {
        pdf.addPage();
        
        // Add header
        pdf.setFontSize(18);
        pdf.setTextColor(21, 101, 192);
        pdf.text('TASK LIST SUMMARY', margin, 20);
        
        // Add table headers
        pdf.setFontSize(10);
        pdf.setDrawColor(100, 100, 100);
        pdf.setFillColor(240, 240, 240);
        pdf.setTextColor(60, 60, 60);
        
        // Draw header background
        pdf.rect(margin, 30, pageWidth - (margin * 2), 8, 'F');
        
        // Add header text
        pdf.text('Task Name', margin + 2, 35);
        pdf.text('Brand', margin + 70, 35);
        pdf.text('Assignee', margin + 105, 35);
        pdf.text('Status', margin + 140, 35);
        pdf.text('Due Date', margin + 165, 35);
        
        // Add rows
        pdf.setFontSize(9);
        pdf.setTextColor(80, 80, 80);
        
        let rowY = 43;
        const rowHeight = 7;
        const maxTasksInTable = 25; // Limit tasks shown in table
        
        // Sort tasks by due date (closest first)
        const sortedTasks = [...tasks].sort((a, b) => {
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date) - new Date(b.due_date);
        });
        
        // Show only the first maxTasksInTable tasks
        const tasksToShow = sortedTasks.slice(0, maxTasksInTable);
        
        // Alternate row colors
        let isEvenRow = false;
        
        for (const task of tasksToShow) {
          // Add alternating row background
          if (isEvenRow) {
            pdf.setFillColor(250, 250, 250);
            pdf.rect(margin, rowY - 3, pageWidth - (margin * 2), rowHeight, 'F');
          }
          isEvenRow = !isEvenRow;
          
          // Add task data
          const name = task.name || 'Untitled';
          const brand = task.brand || 'N/A';
          const assignee = task.assignee || 'Unassigned';
          const status = task.completed ? 'Completed' : (task.status || 'Open');
          const dueDate = task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date';
          
          // Truncate long text
          const truncate = (text, maxLen) => text.length > maxLen ? text.substring(0, maxLen - 3) + '...' : text;
          
          pdf.text(truncate(name, 35), margin + 2, rowY);
          pdf.text(truncate(brand, 17), margin + 70, rowY);
          pdf.text(truncate(assignee, 17), margin + 105, rowY);
          pdf.text(status, margin + 140, rowY);
          pdf.text(dueDate, margin + 165, rowY);
          
          rowY += rowHeight;
          
          // Check if we need a new page
          if (rowY > pageHeight - margin) {
            pdf.addPage();
            rowY = margin + 10;
            
            // Re-add headers on new page
            pdf.setFontSize(10);
            pdf.setDrawColor(100, 100, 100);
            pdf.setFillColor(240, 240, 240);
            pdf.setTextColor(60, 60, 60);
            
            pdf.rect(margin, rowY, pageWidth - (margin * 2), 8, 'F');
            
            pdf.text('Task Name', margin + 2, rowY + 5);
            pdf.text('Brand', margin + 70, rowY + 5);
            pdf.text('Assignee', margin + 105, rowY + 5);
            pdf.text('Status', margin + 140, rowY + 5);
            pdf.text('Due Date', margin + 165, rowY + 5);
            
            rowY += 13;
            pdf.setFontSize(9);
            pdf.setTextColor(80, 80, 80);
          }
        }
        
        // Add a note if we truncated the task list
        if (tasks.length > maxTasksInTable) {
          rowY += 5;
          pdf.setTextColor(100, 100, 100);
          pdf.setFontSize(8);
          pdf.text(`Note: Showing ${maxTasksInTable} of ${tasks.length} total tasks (sorted by due date)`, margin, rowY);
        }
      }
      
      // Add footer with page numbers
      const totalPages = pdf.internal.getNumberOfPages();
      
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
        pdf.text('SPORTFIVE Asana Dashboard', margin, pageHeight - 5);
        pdf.text(`Generated: ${currentDate}`, pageWidth - margin, pageHeight - 5, { align: 'right' });
      }
      
      // Save PDF with dynamic filename including date
      const dateStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD format
      pdf.save(`SPORTFIVE-Asana-Report-${dateStr}.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="mb-6">
      <button
        onClick={generatePDF}
        disabled={isGenerating}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {isGenerating ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating Executive Report...
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Generate Executive Report (PDF)
          </>
        )}
      </button>
    </div>
  );
};

export default ReportGenerator; 