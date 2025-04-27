import { useState } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const ReportGenerator = ({ tasks, distinctValues }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      // Create a new PDF document in landscape orientation with 16:9 aspect ratio
      // A4 is 210mm x 297mm, so we'll use a custom page size to match 16:9
      const width = 280; // Width in mm
      const height = 158; // Height in mm (16:9 ratio)
      const pdf = new jsPDF('landscape', 'mm', [width, height]);
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10; // margin in mm
      
      // Add title and logo
      pdf.setFontSize(28);
      pdf.setTextColor(21, 101, 192); // Blue color for title
      pdf.text('SPORTFIVE', pageWidth / 2, 20, { align: 'center' });
      
      pdf.setFontSize(18);
      pdf.setTextColor(0, 0, 0); // Black text for subtitle
      pdf.text('Executive Asana Task Report', pageWidth / 2, 30, { align: 'center' });
      
      // Add date
      const currentDate = new Date().toLocaleDateString();
      const currentMonth = new Date().toLocaleString('default', { month: 'long' });
      const currentYear = new Date().getFullYear();
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100); // Gray color for date
      pdf.text(`Generated on: ${currentDate}`, pageWidth / 2, 38, { align: 'center' });
      
      // Add a divider line
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, 42, pageWidth - margin, 42);
      
      // Add summary section in a box
      const summaryBoxY = 50;
      const summaryBoxHeight = 35;
      pdf.setFillColor(248, 250, 252); // Light gray background
      pdf.setDrawColor(230, 230, 230);
      pdf.roundedRect(margin, summaryBoxY, 80, summaryBoxHeight, 3, 3, 'F');
      
      // Summary statistics
      pdf.setFontSize(14);
      pdf.setTextColor(33, 33, 33);
      pdf.text('EXECUTIVE SUMMARY', margin + 5, summaryBoxY + 8);
      
      pdf.setFontSize(11);
      pdf.setTextColor(80, 80, 80);
      
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(task => task.completed).length;
      const incompleteTasks = totalTasks - completedTasks;
      const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0;
      
      pdf.text(`Reporting Period: ${currentMonth} ${currentYear}`, margin + 5, summaryBoxY + 15);
      pdf.text(`Total Tasks: ${totalTasks}`, margin + 5, summaryBoxY + 21);
      pdf.text(`Completion Rate: ${completionRate}%`, margin + 5, summaryBoxY + 27);
      
      // Status summary as mini horizontal bar
      const barY = summaryBoxY + 32;
      const barWidth = 70;
      const barHeight = 3;
      
      // Background bar (total)
      pdf.setFillColor(220, 220, 220);
      pdf.rect(margin + 5, barY, barWidth, barHeight, 'F');
      
      // Completed bar
      if (totalTasks > 0) {
        const completeWidth = (completedTasks / totalTasks) * barWidth;
        pdf.setFillColor(52, 168, 83); // Green for completed
        pdf.rect(margin + 5, barY, completeWidth, barHeight, 'F');
      }
      
      // Add KPI section title
      pdf.setFontSize(16);
      pdf.setTextColor(33, 33, 33);
      pdf.text('KEY PERFORMANCE INDICATORS', margin, summaryBoxY + summaryBoxHeight + 15);
      
      // Array of chart IDs with their titles
      const chartInfo = [
        { id: 'completion-status-chart', title: 'Task Completion Status' },
        { id: 'tasks-by-deadline-chart', title: 'Tasks by Deadline' },
        { id: 'tasks-by-brand-chart', title: 'Tasks by Brand' },
        { id: 'tasks-by-assignee-chart', title: 'Tasks by Assignee' },
        { id: 'tasks-by-asset-chart', title: 'Tasks by Asset Type' },
        { id: 'tasks-by-requester-chart', title: 'Tasks by Requester' }
      ];
      
      // Set up a 3x2 grid layout for charts
      const chartStartY = summaryBoxY + summaryBoxHeight + 20;
      const chartWidth = (pageWidth - (margin * 4)) / 3; // 3 columns with margins
      const chartHeight = 55; // Height for each chart
      const chartMargin = 5; // Space between charts
      
      // Process charts in a grid layout
      for (let i = 0; i < chartInfo.length; i++) {
        const row = Math.floor(i / 3);
        const col = i % 3;
        
        const chartX = margin + (col * (chartWidth + chartMargin));
        const chartY = chartStartY + (row * (chartHeight + chartMargin));
        
        const chart = document.getElementById(chartInfo[i].id);
        if (chart) {
          try {
            // Convert chart to canvas
            const canvas = await html2canvas(chart, {
              scale: 2,
              logging: false,
              useCORS: true,
              backgroundColor: '#ffffff',
              width: 400
            });
            
            // Add chart title
            pdf.setFontSize(10);
            pdf.setTextColor(33, 33, 33);
            pdf.text(chartInfo[i].title, chartX, chartY);
            
            // Add image
            const imgData = canvas.toDataURL('image/png');
            pdf.addImage(imgData, 'PNG', chartX, chartY + 3, chartWidth, chartHeight - 10);
            
          } catch (err) {
            console.error(`Error processing chart ${chartInfo[i].id}:`, err);
          }
        }
      }
      
      // Special handling for the trend chart (full width on a new page)
      const trendChart = document.getElementById('task-creation-trend-chart');
      if (trendChart) {
        // Add a new page
        pdf.addPage([width, height]); // Maintain 16:9 aspect ratio
        
        try {
          // Convert chart to canvas
          const trendCanvas = await html2canvas(trendChart, {
            scale: 2,
            logging: false,
            useCORS: true,
            backgroundColor: '#ffffff',
            width: 800
          });
          
          // Add title
          pdf.setFontSize(18);
          pdf.setTextColor(21, 101, 192);
          pdf.text('Task Creation Trend Over Time', pageWidth / 2, 20, { align: 'center' });
          
          // Calculate dimensions for trend chart (almost full page)
          const imgWidth = pageWidth - (margin * 2);
          const imgHeight = pageHeight - 40; // Leave room for title and footer
          
          // Add image
          const imgData = trendCanvas.toDataURL('image/png');
          pdf.addImage(imgData, 'PNG', margin, 30, imgWidth, imgHeight - 15);
          
        } catch (err) {
          console.error('Error processing trend chart:', err);
        }
      }
      
      // Add footer with page numbers to all pages
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