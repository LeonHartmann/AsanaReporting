import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Exports the dashboard content to a PDF file by capturing individual sections.
 *
 * @param {string[]} elementIdsToCapture Array of HTML element IDs to capture.
 * @param {object} filters The currently applied filters object.
 * @param {function} setIsExporting Callback function to set the exporting state (true/false).
 * @param {function} setError Callback function to set an error message.
 */
export const exportDashboardToPDF = async (elementIdsToCapture, filters, setIsExporting, setError) => {
  console.log("Exporting PDF by elements...");

  // Basic validation
  if (!Array.isArray(elementIdsToCapture) || elementIdsToCapture.length === 0) {
    console.error("No element IDs provided for PDF export.");
    setError("Configuration error: No elements specified for export.");
    return;
  }

  setIsExporting(true); // Signal that export has started
  setError(''); // Clear previous errors

  // Format Filters Text
  const filtersApplied = Object.entries(filters)
    .filter(([key, value]) => value && (!Array.isArray(value) || value.length > 0))
    .map(([key, value]) => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${Array.isArray(value) ? value.join(', ') : value}`)
    .join('\n');

  // Get current date and time
  const now = new Date();
  const dateTimeString = now.toLocaleString();

  try {
    console.log("Creating PDF...");
    const pdf = new jsPDF({
        orientation: 'landscape', // Keep landscape for potentially wide elements
        unit: 'pt',
        format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 40; // points
    const availableWidth = pdfWidth - 2 * margin;
    let currentY = margin; // Track current Y position on the PDF

    // --- PDF Header (Title, Date, Filters) --- 
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.text("GGBC Reporting Dashboard", pdfWidth / 2, currentY, { align: 'center' });
    currentY += 15;

    pdf.setFontSize(8);
    pdf.setFont(undefined, 'normal');
    pdf.text(`Exported: ${dateTimeString}`, pdfWidth - margin, margin + 5, { align: 'right' });
    currentY += 10;

    pdf.setFontSize(10);
    pdf.setFont(undefined, 'bold');
    pdf.text('Applied Filters:', margin, currentY);
    currentY += 15;
    pdf.setFont(undefined, 'normal');
    const splitFilters = pdf.splitTextToSize(filtersApplied || 'None', availableWidth);
    pdf.text(splitFilters, margin, currentY);
    currentY += (splitFilters.length * 10) + 15; // Add extra spacing after filters

    // --- Capture and Add Elements --- 
    for (const elementId of elementIdsToCapture) {
        const element = document.getElementById(elementId);
        if (!element) {
            console.warn(`Element with ID '${elementId}' not found. Skipping.`);
            continue; // Skip to the next element
        }

        console.log(`Capturing element: #${elementId}`);
        
        // Add temporary padding and slightly increase delay
        const originalPaddingTop = element.style.paddingTop;
        element.style.paddingTop = '5px'; // Add 5px padding at the top

        await new Promise(resolve => setTimeout(resolve, 150)); // Increased delay

        const canvas = await html2canvas(element, {
            useCORS: true,
            backgroundColor: '#ffffff', 
            // Consider adding scale if quality is still low, e.g., scale: 2
        });

        // Restore original padding
        element.style.paddingTop = originalPaddingTop;

        console.log(`Canvas generated for #${elementId}, adding to PDF...`);
        const imgData = canvas.toDataURL('image/jpeg', 0.85); // Slightly higher quality JPEG
        const imgProps = pdf.getImageProperties(imgData);
        
        // Scale image to fit available width
        const imgHeight = (imgProps.height * availableWidth) / imgProps.width;
        const imgWidth = availableWidth;

        // Check if element fits on the current page
        const remainingPageHeight = pdfHeight - margin - currentY;
        if (imgHeight > remainingPageHeight) {
            console.log(`Adding new page for element #${elementId}`);
            pdf.addPage();
            currentY = margin; // Reset Y position to top margin
            // Optional: Repeat header on new pages? (Could add complexity)
        }

        // Add the image
        pdf.addImage(imgData, 'JPEG', margin, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 15; // Update Y position, add spacing after image
    }

    // --- Save PDF --- 
    console.log("Saving PDF...");
    pdf.save(`GGBC_Dashboard_Export_${now.toISOString().split('T')[0]}.pdf`);
    console.log("PDF Saved.");

  } catch (err) {
      console.error("Error generating PDF:", err);
      setError(`Failed to generate PDF export: ${err.message || 'Unknown error'}`);
      // Note: Style restoration is no longer needed here as we capture individual elements
  } finally {
      setIsExporting(false); // Hide loading indicator
  }
}; 