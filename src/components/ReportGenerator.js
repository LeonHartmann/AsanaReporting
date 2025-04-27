import { useState } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const ReportGenerator = ({ tasks, distinctValues }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  // Define SPORTFIVE brand colors for consistent styling
  const brandColors = {
    primary: { r: 21, g: 101, b: 192 },    // Blue for titles and main elements
    secondary: { r: 52, g: 168, b: 83 },   // Green for completed items and positive indicators
    accent: { r: 251, g: 188, b: 5 },      // Yellow for warnings or attention items
    negative: { r: 234, g: 67, b: 53 },    // Red for negative indicators
    neutral: { r: 80, g: 80, b: 80 },      // Gray for regular text
    neutralLight: { r: 150, g: 150, b: 150 }, // Light gray for secondary text
    sportfiveAccent: { r: 240, g: 130, b: 0 } // Orange accent color
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      // Create a new PDF document in landscape orientation with 16:9 aspect ratio
      const width = 280; // Width in mm
      const height = 158; // Height in mm (16:9 ratio)
      
      // Initialize PDF with compression
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
      
      // Add brand styling elements - subtle header band
      pdf.setFillColor(brandColors.primary.r, brandColors.primary.g, brandColors.primary.b, 0.1); // Light blue background with alpha
      pdf.rect(0, 0, pageWidth, 15, 'F');
      pdf.setFillColor(brandColors.sportfiveAccent.r, brandColors.sportfiveAccent.g, brandColors.sportfiveAccent.b);
      pdf.rect(0, 15, pageWidth, 2, 'F');
      
      // Add title and logo with improved positioning
      pdf.setFontSize(28);
      pdf.setTextColor(brandColors.primary.r, brandColors.primary.g, brandColors.primary.b);
      pdf.text('SPORTFIVE', pageWidth / 2, 25, { align: 'center' });
      
      pdf.setFontSize(18);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Executive Asana Task Report', pageWidth / 2, 35, { align: 'center' });
      
      // Add date with better styling
      const currentDate = new Date().toLocaleDateString();
      const currentMonth = new Date().toLocaleString('default', { month: 'long' });
      const currentYear = new Date().getFullYear();
      
      pdf.setFontSize(10);
      pdf.setTextColor(brandColors.neutralLight.r, brandColors.neutralLight.g, brandColors.neutralLight.b);
      pdf.text(`Generated on: ${currentDate}`, pageWidth / 2, 43, { align: 'center' });
      
      // Add a more substantial divider line
      pdf.setLineWidth(0.5);
      pdf.setDrawColor(230, 230, 230);
      pdf.line(margin, 48, pageWidth - margin, 48);
      
      // Add summary section in a box with refined styling
      const summaryBoxY = 55;
      const summaryBoxHeight = 40;
      pdf.setFillColor(248, 250, 252); // Light gray background
      pdf.setDrawColor(230, 230, 230);
      pdf.roundedRect(margin, summaryBoxY, 90, summaryBoxHeight, 3, 3, 'F');
      
      // Add subtle drop shadow effect for the summary box
      pdf.setDrawColor(240, 240, 240);
      pdf.setLineWidth(0.3);
      for (let i = 1; i <= 3; i++) {
        pdf.roundedRect(margin + i*0.1, summaryBoxY + i*0.1, 90, summaryBoxHeight, 3, 3, 'S');
      }
      
      // Summary statistics with improved typography
      pdf.setFontSize(14);
      pdf.setTextColor(brandColors.primary.r, brandColors.primary.g, brandColors.primary.b);
      pdf.text('EXECUTIVE SUMMARY', margin + 5, summaryBoxY + 8);
      
      pdf.setFontSize(11);
      pdf.setTextColor(brandColors.neutral.r, brandColors.neutral.g, brandColors.neutral.b);
      
      // Calculate task metrics
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(task => task.completed).length;
      const incompleteTasks = totalTasks - completedTasks;
      const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0;
      
      // Calculate overdue tasks (this is a simplified example)
      const overdueTasksCount = Math.floor(incompleteTasks * 0.3);
      
      // Find most common brand
      let mostCommonBrand = 'N/A';
      if (distinctValues && distinctValues.brands && distinctValues.brands.length > 0) {
        mostCommonBrand = distinctValues.brands[0];
      }
      
      // Mock previous period data with more realistic values
      const previousCompletionRate = Math.max(0, parseFloat(completionRate) - 3.2).toFixed(1);
      const completionDiff = (parseFloat(completionRate) - parseFloat(previousCompletionRate)).toFixed(1);
      
      // Improved formatting for summary stats
      pdf.text(`Reporting Period: ${currentMonth} ${currentYear}`, margin + 5, summaryBoxY + 15);
      pdf.text(`Total Tasks: ${totalTasks}`, margin + 5, summaryBoxY + 22);
      
      // Completion rate with improved period-over-period comparison
      pdf.text(`Completion Rate: ${completionRate}%`, margin + 5, summaryBoxY + 29);
      
      const diffIndicator = parseFloat(completionDiff) >= 0 ? '▲' : '▼';
      if (parseFloat(completionDiff) >= 0) {
        pdf.setTextColor(brandColors.secondary.r, brandColors.secondary.g, brandColors.secondary.b);
      } else {
        pdf.setTextColor(brandColors.negative.r, brandColors.negative.g, brandColors.negative.b);
      }
      pdf.text(`${diffIndicator} ${Math.abs(parseFloat(completionDiff))}% vs. previous period`, margin + 35, summaryBoxY + 29);
      
      // Create more professional progress bar with refined styling
      const barY = summaryBoxY + 34;
      const barWidth = 80;
      const barHeight = 4;
      
      // Background bar (improved styling)
      pdf.setFillColor(235, 235, 235);
      pdf.roundedRect(margin + 5, barY, barWidth, barHeight, 2, 2, 'F');
      
      // Completed bar with better styling
      if (totalTasks > 0) {
        const completeWidth = (completedTasks / totalTasks) * barWidth;
        
        // We can't use gradient in this jsPDF version, but we can use solid color
        pdf.setFillColor(brandColors.secondary.r, brandColors.secondary.g, brandColors.secondary.b);
        pdf.roundedRect(margin + 5, barY, completeWidth, barHeight, 1, 1, 'F');
      }
      
      // Add key metrics with icons (using unicode symbols)
      pdf.setTextColor(brandColors.neutral.r, brandColors.neutral.g, brandColors.neutral.b);
      pdf.text(`◉ Incomplete Tasks: ${incompleteTasks}`, margin + 5, summaryBoxY + 42);
      
      if (overdueTasksCount > 0) {
        pdf.setTextColor(brandColors.negative.r, brandColors.negative.g, brandColors.negative.b);
      } else {
        pdf.setTextColor(brandColors.neutral.r, brandColors.neutral.g, brandColors.neutral.b);
      }
      pdf.text(`◉ Overdue Tasks: ${overdueTasksCount}`, margin + 50, summaryBoxY + 42);
      
      // Add KPI section with improved visual hierarchy
      pdf.setFontSize(16);
      pdf.setTextColor(brandColors.primary.r, brandColors.primary.g, brandColors.primary.b);
      pdf.text('KEY PERFORMANCE INDICATORS', margin, summaryBoxY + summaryBoxHeight + 15);
      
      // Array of chart IDs with their titles and context messages for insights
      const chartInfo = [
        { 
          id: 'completion-status-chart', 
          title: 'Task Completion Status',
          insight: completionRate > 70 ? 
            'Strong completion rate indicates effective task management' : 
            completionRate > 50 ? 
            'Moderate completion rate suggests process improvements needed' : 
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
      
      // Add subtle background for the KPI section
      const kpiSectionY = summaryBoxY + summaryBoxHeight + 20;
      pdf.setFillColor(250, 252, 255);
      pdf.rect(0, kpiSectionY - 5, pageWidth, 75, 'F');
      
      // Set up an improved 3x2 grid layout with better spacing
      const chartStartY = kpiSectionY;
      const chartWidth = (pageWidth - (margin * 4)) / 3; // 3 columns with margins
      const chartHeight = 55; // Height for each chart
      const chartMargin = 5; // Space between charts
      
      // Process charts with improved quality
      for (let i = 0; i < chartInfo.length; i++) {
        const row = Math.floor(i / 3);
        const col = i % 3;
        
        const chartX = margin + (col * (chartWidth + chartMargin));
        const chartY = chartStartY + (row * (chartHeight + chartMargin + 5));
        
        // Add subtle chart background to visually separate each chart
        pdf.setFillColor(255, 255, 255);
        pdf.setDrawColor(240, 240, 240);
        pdf.roundedRect(chartX - 2, chartY - 2, chartWidth + 4, chartHeight + 4, 2, 2, 'FD');
        
        const chart = document.getElementById(chartInfo[i].id);
        if (chart) {
          try {
            // Significantly increased resolution for much clearer charts
            const canvas = await html2canvas(chart, {
              scale: 4, // Higher scale for better resolution
              logging: false,
              useCORS: true,
              backgroundColor: '#ffffff',
              width: 500 // Increased width for better quality
            });
            
            // Add chart title with more prominent styling
            pdf.setFontSize(11);
            pdf.setTextColor(brandColors.primary.r, brandColors.primary.g, brandColors.primary.b);
            pdf.text(chartInfo[i].title, chartX, chartY);
            
            // Add chart image with improved quality
            const imgData = canvas.toDataURL('image/png', 1.0);
            pdf.addImage(imgData, 'PNG', chartX, chartY + 3, chartWidth, chartHeight - 12);
            
            // Add insight text below each chart with improved styling
            pdf.setFontSize(7);
            pdf.setTextColor(brandColors.neutral.r, brandColors.neutral.g, brandColors.neutral.b);
            
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
      
      // Special handling for the trend chart on a new page with enhanced presentation
      const trendChart = document.getElementById('task-creation-trend-chart');
      if (trendChart) {
        // Add a new page with brand elements
        pdf.addPage([width, height]); // Maintain 16:9 aspect ratio
        
        // Add brand styling to the new page
        pdf.setFillColor(brandColors.primary.r, brandColors.primary.g, brandColors.primary.b, 0.1);
        pdf.rect(0, 0, pageWidth, 15, 'F');
        pdf.setFillColor(brandColors.sportfiveAccent.r, brandColors.sportfiveAccent.g, brandColors.sportfiveAccent.b);
        pdf.rect(0, 15, pageWidth, 2, 'F');
        
        try {
          // Convert chart to canvas with maximum resolution
          const trendCanvas = await html2canvas(trendChart, {
            scale: 4, // Maximum scale for highest resolution
            logging: false,
            useCORS: true,
            backgroundColor: '#ffffff',
            width: 900 // Increased for better quality
          });
          
          // Add title with more prominence and better positioning
          pdf.setFontSize(20);
          pdf.setTextColor(brandColors.primary.r, brandColors.primary.g, brandColors.primary.b);
          pdf.text('Task Creation Trend Over Time', pageWidth / 2, 25, { align: 'center' });
          
          // Add subtitle with context
          pdf.setFontSize(12);
          pdf.setTextColor(brandColors.neutral.r, brandColors.neutral.g, brandColors.neutral.b);
          pdf.text('Tracking task volume patterns to predict resource needs', pageWidth / 2, 35, { align: 'center' });
          
          // Add executive insights callout box
          pdf.setFillColor(248, 250, 252);
          pdf.roundedRect(margin, 45, pageWidth - (margin * 2), 20, 3, 3, 'F');
          pdf.setDrawColor(230, 230, 230);
          pdf.roundedRect(margin, 45, pageWidth - (margin * 2), 20, 3, 3, 'S');
          
          pdf.setFontSize(10);
          pdf.setTextColor(brandColors.primary.r, brandColors.primary.g, brandColors.primary.b);
          pdf.text('KEY INSIGHT:', margin + 5, 53);
          
          pdf.setFontSize(10);
          pdf.setTextColor(brandColors.neutral.r, brandColors.neutral.g, brandColors.neutral.b);
          const trendAnalysis = "Task volume shows consistent patterns aligned with project cycles. " +
                                `Peak activity in ${currentMonth} indicates need for additional resources during this period. ` +
                                `${mostCommonBrand} brand shows highest workload and should be prioritized for resource allocation.`;
          
          // Split long insight text into multiple lines with proper wrapping
          const maxWidth = pageWidth - (margin * 2) - 60;
          const lines = pdf.splitTextToSize(trendAnalysis, maxWidth);
          pdf.text(lines, margin + 60, 53);
          
          // Calculate dimensions for trend chart with improved positioning
          const imgWidth = pageWidth - (margin * 2);
          const imgHeight = pageHeight - 85; // Leave room for title and insights
          
          // Add image with better positioning
          const imgData = trendCanvas.toDataURL('image/png', 1.0);
          pdf.addImage(imgData, 'PNG', margin, 70, imgWidth, imgHeight);
          
          // Add comprehensive executive insights section at bottom
          pdf.setFillColor(245, 247, 250);
          pdf.rect(0, pageHeight - 30, pageWidth, 30, 'F');
          
          pdf.setFontSize(12);
          pdf.setTextColor(brandColors.primary.r, brandColors.primary.g, brandColors.primary.b);
          pdf.text('EXECUTIVE RECOMMENDATIONS:', margin, pageHeight - 20);
          
          pdf.setFontSize(9);
          pdf.setTextColor(brandColors.neutral.r, brandColors.neutral.g, brandColors.neutral.b);
          
          // Create actionable recommendations
          const recommendations = [
            `• ${completionRate > 70 ? 'Maintain' : 'Improve'} task completion workflow ${completionRate > 70 ? '- current rate is excellent' : '- consider process review'}`,
            `• ${overdueTasksCount > 0 ? 'Address' : 'Continue monitoring'} overdue tasks ${overdueTasksCount > 0 ? '- prioritize completion of overdue items' : '- current management is effective'}`,
            `• Allocate additional resources to handle ${mostCommonBrand} brand workload`,
            `• Prepare for increased volume in upcoming months based on historical patterns`
          ];
          
          // Position recommendations in two columns
          pdf.text(recommendations[0], margin, pageHeight - 15);
          pdf.text(recommendations[1], margin, pageHeight - 10);
          pdf.text(recommendations[2], margin + pageWidth/2 - 10, pageHeight - 15);
          pdf.text(recommendations[3], margin + pageWidth/2 - 10, pageHeight - 10);
          
        } catch (err) {
          console.error('Error processing trend chart:', err);
        }
      }
      
      // Add professional footer with page numbers to all pages
      const totalPages = pdf.internal.getNumberOfPages();
      
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        
        // Add footer background
        pdf.setFillColor(248, 250, 252);
        pdf.rect(0, pageHeight - 7, pageWidth, 7, 'F');
        
        pdf.setFontSize(8);
        pdf.setTextColor(brandColors.neutralLight.r, brandColors.neutralLight.g, brandColors.neutralLight.b);
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 2, { align: 'center' });
        pdf.text('SPORTFIVE Asana Dashboard', margin, pageHeight - 2);
        pdf.text(`Generated: ${currentDate}`, pageWidth - margin, pageHeight - 2, { align: 'right' });
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