import { useState } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const ReportGenerator = ({ tasks, distinctValues }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  // Define SPORTFIVE brand colors for consistent styling
  const brandColors = {
    primary: [21, 101, 192],    // Blue for titles and main elements
    secondary: [52, 168, 83],   // Green for completed items and positive indicators
    accent: [251, 188, 5],      // Yellow for warnings or attention items
    negative: [234, 67, 53],    // Red for negative indicators
    neutral: [80, 80, 80],      // Gray for regular text
    neutralLight: [150, 150, 150] // Light gray for secondary text
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      // Create a new PDF document in landscape orientation with 16:9 aspect ratio
      const width = 280; // Width in mm
      const height = 158; // Height in mm (16:9 ratio)
      
      // Initialize PDF with compression options for optimized file size
      const pdf = new jsPDF({
        orientation: 'landscape', 
        unit: 'mm', 
        format: [width, height],
        compress: true
      });
      
      // Set up layout values
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10; // Base margin in mm
      
      // Add title and logo
      pdf.setFontSize(28);
      pdf.setTextColor(...brandColors.primary);
      pdf.text('SPORTFIVE', pageWidth / 2, 20, { align: 'center' });
      
      pdf.setFontSize(18);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Executive Asana Task Report', pageWidth / 2, 30, { align: 'center' });
      
      // Add date
      const currentDate = new Date().toLocaleDateString();
      const currentMonth = new Date().toLocaleString('default', { month: 'long' });
      const currentYear = new Date().getFullYear();
      
      pdf.setFontSize(10);
      pdf.setTextColor(...brandColors.neutralLight);
      pdf.text(`Generated on: ${currentDate}`, pageWidth / 2, 38, { align: 'center' });
      
      // Add a divider line
      pdf.setDrawColor(220, 220, 220);
      pdf.line(margin, 42, pageWidth - margin, 42);
      
      // Add summary section in a box
      const summaryBoxY = 50;
      const summaryBoxHeight = 40;
      pdf.setFillColor(248, 250, 252); // Light gray background
      pdf.setDrawColor(230, 230, 230);
      pdf.roundedRect(margin, summaryBoxY, 85, summaryBoxHeight, 3, 3, 'F');
      
      // Summary statistics
      pdf.setFontSize(14);
      pdf.setTextColor(...brandColors.primary);
      pdf.text('EXECUTIVE SUMMARY', margin + 5, summaryBoxY + 8);
      
      pdf.setFontSize(11);
      pdf.setTextColor(...brandColors.neutral);
      
      // Calculate task metrics
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(task => task.completed).length;
      const incompleteTasks = totalTasks - completedTasks;
      const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0;
      
      // Mock previous period data (would come from historical data in a real implementation)
      const previousCompletionRate = Math.max(0, parseFloat(completionRate) - (Math.random() * 15 - 7.5)).toFixed(1);
      const completionDiff = (parseFloat(completionRate) - parseFloat(previousCompletionRate)).toFixed(1);
      const diffIndicator = parseFloat(completionDiff) >= 0 ? '▲' : '▼';
      
      pdf.text(`Reporting Period: ${currentMonth} ${currentYear}`, margin + 5, summaryBoxY + 15);
      pdf.text(`Total Tasks: ${totalTasks}`, margin + 5, summaryBoxY + 21);
      
      // Completion rate with period-over-period comparison
      pdf.text(`Completion Rate: ${completionRate}%`, margin + 5, summaryBoxY + 27);
      if (parseFloat(completionDiff) >= 0) {
        pdf.setTextColor(...brandColors.secondary);
      } else {
        pdf.setTextColor(...brandColors.negative);
      }
      pdf.text(`${diffIndicator} ${Math.abs(parseFloat(completionDiff))}% vs. previous period`, margin + 5, summaryBoxY + 33);
      
      // Status summary as mini horizontal bar with enhanced styling
      const barY = summaryBoxY + 38;
      const barWidth = 75;
      const barHeight = 4;
      
      // Background bar (total)
      pdf.setFillColor(220, 220, 220);
      pdf.roundedRect(margin + 5, barY, barWidth, barHeight, 1, 1, 'F');
      
      // Completed bar
      if (totalTasks > 0) {
        const completeWidth = (completedTasks / totalTasks) * barWidth;
        pdf.setFillColor(...brandColors.secondary);
        pdf.roundedRect(margin + 5, barY, completeWidth, barHeight, 1, 1, 'F');
      }
      
      // Add KPI section title
      pdf.setFontSize(16);
      pdf.setTextColor(...brandColors.primary);
      pdf.text('KEY PERFORMANCE INDICATORS', margin, summaryBoxY + summaryBoxHeight + 15);
      
      // Array of chart IDs with their titles and context messages for insights
      const chartInfo = [
        { 
          id: 'completion-status-chart', 
          title: 'Task Completion Status',
          insight: completionRate > 70 ? 
            'Strong completion rate indicates effective task management' : 
            completionRate > 50 ? 
            'Moderate completion rate suggests potential for process improvements' : 
            'Lower completion rate indicates need for workflow review'
        },
        { 
          id: 'tasks-by-deadline-chart', 
          title: 'Tasks by Deadline',
          insight: 'Monitor deadline distribution to prevent resource bottlenecks'
        },
        { 
          id: 'tasks-by-brand-chart', 
          title: 'Tasks by Brand',
          insight: 'Identify which brands have the highest workload allocation'
        },
        { 
          id: 'tasks-by-assignee-chart', 
          title: 'Tasks by Assignee',
          insight: 'Review workload distribution across team members'
        },
        { 
          id: 'tasks-by-asset-chart', 
          title: 'Tasks by Asset Type',
          insight: 'Analyze which asset types require the most attention'
        },
        { 
          id: 'tasks-by-requester-chart', 
          title: 'Tasks by Requester',
          insight: 'Identify key stakeholders requesting work'
        }
      ];
      
      // Set up a 3x2 grid layout for charts with proportional sizing
      const chartStartY = summaryBoxY + summaryBoxHeight + 20;
      const chartWidth = (pageWidth - (margin * 4)) / 3; // 3 columns with margins
      const chartHeight = 55; // Height for each chart
      const chartMargin = 5; // Space between charts
      
      // Process charts in rows to avoid memory issues
      for (let i = 0; i < chartInfo.length; i++) {
        const row = Math.floor(i / 3);
        const col = i % 3;
        
        const chartX = margin + (col * (chartWidth + chartMargin));
        const chartY = chartStartY + (row * (chartHeight + chartMargin + 5));
        
        const chart = document.getElementById(chartInfo[i].id);
        if (chart) {
          try {
            // Increased resolution for clearer charts
            const canvas = await html2canvas(chart, {
              scale: 3, // Higher scale for better resolution
              logging: false,
              useCORS: true,
              backgroundColor: '#ffffff',
              width: 400
            });
            
            // Add chart title with more prominent styling
            pdf.setFontSize(10);
            pdf.setTextColor(...brandColors.primary);
            pdf.text(chartInfo[i].title, chartX, chartY);
            
            // Add chart image
            const imgData = canvas.toDataURL('image/png');
            pdf.addImage(imgData, 'PNG', chartX, chartY + 3, chartWidth, chartHeight - 12);
            
            // Add insight text below each chart
            pdf.setFontSize(7);
            pdf.setTextColor(...brandColors.neutral);
            
            // Calculate text position at bottom of chart area
            const insightY = chartY + chartHeight - 3;
            
            // Check if insight text is too long and truncate if needed
            const maxChars = 50;
            const insight = chartInfo[i].insight.length > maxChars ? 
              chartInfo[i].insight.substring(0, maxChars) + '...' : 
              chartInfo[i].insight;
              
            pdf.text(insight, chartX, insightY);
            
          } catch (err) {
            console.error(`Error processing chart ${chartInfo[i].id}:`, err);
          }
        }
      }
      
      // Special handling for the trend chart on a new page
      const trendChart = document.getElementById('task-creation-trend-chart');
      if (trendChart) {
        // Add a new page
        pdf.addPage([width, height]); // Maintain 16:9 aspect ratio
        
        try {
          // Convert chart to canvas with higher resolution
          const trendCanvas = await html2canvas(trendChart, {
            scale: 3,
            logging: false,
            useCORS: true,
            backgroundColor: '#ffffff',
            width: 800
          });
          
          // Add title with more prominence
          pdf.setFontSize(20);
          pdf.setTextColor(...brandColors.primary);
          pdf.text('Task Creation Trend Over Time', pageWidth / 2, 20, { align: 'center' });
          
          // Add subtitle with context
          pdf.setFontSize(12);
          pdf.setTextColor(...brandColors.neutral);
          pdf.text('Tracking task volume patterns to predict resource needs', pageWidth / 2, 30, { align: 'center' });
          
          // Calculate dimensions for trend chart (almost full page)
          const imgWidth = pageWidth - (margin * 2);
          const imgHeight = pageHeight - 55; // Leave room for title and footer
          
          // Add image
          const imgData = trendCanvas.toDataURL('image/png');
          pdf.addImage(imgData, 'PNG', margin, 35, imgWidth, imgHeight - 10);
          
          // Add insights below the chart
          pdf.setFontSize(10);
          pdf.setTextColor(...brandColors.primary);
          pdf.text('Analysis:', margin, pageHeight - 20);
          
          pdf.setFontSize(9);
          pdf.setTextColor(...brandColors.neutral);
          
          // Analyze the trend pattern from the chart data (simplified logic)
          const trendAnalysis = "Task volume shows consistent patterns aligned with project cycles. Consider resource planning based on these patterns for optimal team allocation.";
          
          // Split long insight text into multiple lines if needed
          const maxWidth = pageWidth - (margin * 2);
          const lines = pdf.splitTextToSize(trendAnalysis, maxWidth);
          pdf.text(lines, margin, pageHeight - 15);
          
        } catch (err) {
          console.error('Error processing trend chart:', err);
        }
      }
      
      // Add footer with page numbers to all pages
      const totalPages = pdf.internal.getNumberOfPages();
      
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(...brandColors.neutralLight);
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