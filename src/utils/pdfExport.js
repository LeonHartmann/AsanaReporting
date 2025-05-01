import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Adds the standard header to the current PDF page.
 * @param {jsPDF} pdf The jsPDF instance.
 * @param {number} currentY The starting Y position for the header.
 * @param {string} dateTimeString The formatted date/time string.
 * @param {string[]} splitFilters The formatted and split filter text.
 * @returns {number} The Y position after adding the header.
 */
const addPdfHeader = (pdf, currentY, dateTimeString, splitFilters) => {
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const margin = 40;
    const availableWidth = pdfWidth - 2 * margin;
    let y = currentY;

    // --- PDF Header (Title, Date, Filters) ---
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.text("GGBC Reporting Dashboard", pdfWidth / 2, y, { align: 'center' });
    y += 15;

    pdf.setFontSize(8);
    pdf.setFont(undefined, 'normal');
    // Position date relative to the right margin consistently
    pdf.text(`Exported: ${dateTimeString}`, pdfWidth - margin, margin + 5, { align: 'right' }); // Use fixed top margin for date consistency
    y += 10; // Adjust Y based on title's position

    pdf.setFontSize(10);
    pdf.setFont(undefined, 'bold');
    pdf.text('Applied Filters:', margin, y);
    y += 15;
    pdf.setFont(undefined, 'normal');
    pdf.text(splitFilters, margin, y);
    y += (splitFilters.length * 10) + 15; // Add extra spacing after filters

    return y; // Return the updated Y position
};


/**
 * Exports the dashboard content to a PDF file by capturing individual sections.
 *
 * @param {string[]} elementIdsToCapture Array of HTML element IDs to capture.
 * @param {object} filters The currently applied filters object.
 * @param {function} setIsExporting Callback function to set the exporting state (true/false).
 * @param {function} setError Callback function to set an error message.
 * @param {function} [setProgress] Optional callback for progress updates (e.g., setProgress({ current: i, total: n })).
 */
export const exportDashboardToPDF = async (
    elementIdsToCapture,
    filters,
    setIsExporting,
    setError,
    setProgress // Optional progress callback
) => {
    console.log("Exporting PDF by elements...");

    // Basic validation
    if (!Array.isArray(elementIdsToCapture) || elementIdsToCapture.length === 0) {
        console.error("No element IDs provided for PDF export.");
        setError("Configuration error: No elements specified for export.");
        return;
    }

    setIsExporting(true);
    setError('');
    if (setProgress) setProgress({ current: 0, total: elementIdsToCapture.length });

    // --- Prepare PDF and Header Content ---
    const now = new Date();
    const dateTimeString = now.toLocaleString(); // Consider using toLocaleDateString and toLocaleTimeString for more control

    const filtersApplied = Object.entries(filters)
        .filter(([key, value]) => value && (!Array.isArray(value) || value.length > 0))
        .map(([key, value]) => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${Array.isArray(value) ? value.join(', ') : value}`)
        .join('\n'); // Keep newline for potential multi-line display in PDF

    const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'pt',
        format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 40; // points
    const availableWidth = pdfWidth - 2 * margin;
    const availableHeight = pdfHeight - 2 * margin; // Max usable height per page
    let currentY = margin; // Start Y position below the top margin

    // Pre-split filter text for header function
    const splitFilters = pdf.splitTextToSize(filtersApplied || 'None', availableWidth);

    // Add header to the first page
    currentY = addPdfHeader(pdf, currentY, dateTimeString, splitFilters);

    try {
        console.log("Starting element capture loop...");
        let elementIndex = 0;

        for (const elementId of elementIdsToCapture) {
            elementIndex++;
            if (setProgress) setProgress({ current: elementIndex, total: elementIdsToCapture.length, stage: `Capturing ${elementId}` });

            const element = document.getElementById(elementId);
            if (!element) {
                console.warn(`Element with ID '${elementId}' not found. Skipping.`);
                continue; // Skip to the next element
            }

            console.log(`Capturing element: #${elementId}`);

            // --- html2canvas Capture ---
            // REMOVED: await new Promise(resolve => setTimeout(resolve, 100)); // Investigate if truly needed
            let canvas;
            try {
                 canvas = await html2canvas(element, {
                    useCORS: true,
                    backgroundColor: '#ffffff', // Important for consistency
                    // OPTIMIZATION: Use scale for better quality (especially on HiDPI)
                    scale: window.devicePixelRatio || 2,
                    logging: false, // Disable logging for slight performance gain in production
                    // Allow Taint can sometimes help with CORS issues but taints the canvas
                    // allowTaint: false,
                });
            } catch (canvasError) {
                console.error(`html2canvas failed for element #${elementId}:`, canvasError);
                setError(`Error capturing element #${elementId}. Skipping.`);
                continue; // Skip this element
            }


            if (setProgress) setProgress({ current: elementIndex, total: elementIdsToCapture.length, stage: `Processing ${elementId}` });

            console.log(`Canvas generated for #${elementId}, adding to PDF...`);

            // OPTIMIZATION: Try 'image/png' for potentially better quality (especially charts/text)
            // const imgData = canvas.toDataURL('image/jpeg', 0.9); // Higher quality JPEG
            const imgData = canvas.toDataURL('image/png');    // Lossless PNG

            const imgProps = pdf.getImageProperties(imgData);

            // Scale image to fit available width, maintaining aspect ratio
            const imgWidth = availableWidth;
            const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
            const spaceNeeded = imgHeight + 15; // Image height + spacing

            // --- Page Break Logic ---
            // Check if the image *plus spacing* exceeds the available height on the *current* page
            if (currentY + spaceNeeded > pdfHeight - margin) { // Check against bottom margin
                console.log(`Adding new page for element #${elementId}`);
                pdf.addPage();
                currentY = margin; // Reset Y position to top margin
                // OPTIMIZATION: Add header to new pages
                currentY = addPdfHeader(pdf, currentY, dateTimeString, splitFilters);
            }

            // Add the image
            pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight); // Use 'PNG' if using PNG
            currentY += spaceNeeded; // Update Y position

        } // End of loop

        // --- Save PDF ---
        console.log("Saving PDF...");
        if (setProgress) setProgress({ current: elementIdsToCapture.length, total: elementIdsToCapture.length, stage: "Saving PDF" });
        const filename = `GGBC_Dashboard_Export_${now.toISOString().split('T')[0]}.pdf`;
        pdf.save(filename);
        console.log("PDF Saved as", filename);

    } catch (err) {
        console.error("Error generating PDF:", err);
        setError(`Failed to generate PDF export: ${err.message || 'Unknown error'}`);
    } finally {
        setIsExporting(false); // Hide loading indicator
        if (setProgress) setProgress(null); // Clear progress
    }
};