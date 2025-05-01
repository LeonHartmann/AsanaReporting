import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// --- addPdfHeader function remains the same as before ---
const addPdfHeader = (pdf, currentY, dateTimeString, splitFilters) => {
    // ... (implementation from previous answer) ...
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const margin = 40;
    const availableWidth = pdfWidth - 2 * margin;
    let y = currentY;

    // PDF Header (Title, Date, Filters)
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.text("GGBC Reporting Dashboard", pdfWidth / 2, y, { align: 'center' });
    y += 15;

    pdf.setFontSize(8);
    pdf.setFont(undefined, 'normal');
    pdf.text(`Exported: ${dateTimeString}`, pdfWidth - margin, margin + 5, { align: 'right' });
    y += 10;

    pdf.setFontSize(10);
    pdf.setFont(undefined, 'bold');
    pdf.text('Applied Filters:', margin, y);
    y += 15;
    pdf.setFont(undefined, 'normal');
    pdf.text(splitFilters, margin, y);
    y += (splitFilters.length * 10) + 15;

    return y;
};

/**
 * Takes a source canvas and returns a new canvas with 16:9 aspect ratio,
 * drawing the source canvas centered within it with padding.
 * @param {HTMLCanvasElement} sourceCanvas The canvas from html2canvas.
 * @param {string} [backgroundColor='#ffffff'] The background color for padding.
 * @returns {HTMLCanvasElement} A new canvas with 16:9 aspect ratio.
 */
const convertTo16x9Canvas = (sourceCanvas, backgroundColor = '#ffffff') => {
    const sourceWidth = sourceCanvas.width;
    const sourceHeight = sourceCanvas.height;
    const sourceRatio = sourceWidth / sourceHeight;
    const targetRatio = 16 / 9;

    let targetWidth = sourceWidth;
    let targetHeight = sourceHeight;

    if (sourceRatio > targetRatio) {
        // Source is wider than 16:9, padding will be added top/bottom
        targetHeight = sourceWidth / targetRatio; // Calculate height based on source width and 16:9 ratio
    } else if (sourceRatio < targetRatio) {
        // Source is taller than 16:9, padding will be added left/right
        targetWidth = sourceHeight * targetRatio; // Calculate width based on source height and 16:9 ratio
    }
    // If sourceRatio === targetRatio, target dimensions remain source dimensions

    const targetCanvas = document.createElement('canvas');
    targetCanvas.width = targetWidth;
    targetCanvas.height = targetHeight;

    const ctx = targetCanvas.getContext('2d');

    // Fill background color for padding
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    // Calculate coordinates to draw the source canvas centered
    const drawX = (targetWidth - sourceWidth) / 2;
    const drawY = (targetHeight - sourceHeight) / 2;

    // Draw the source canvas onto the target canvas
    ctx.drawImage(sourceCanvas, drawX, drawY, sourceWidth, sourceHeight);

    console.log(`Converted canvas from ${sourceWidth}x${sourceHeight} to 16:9 ${targetWidth}x${targetHeight}`);

    return targetCanvas;
};


/**
 * Exports the dashboard content to a PDF file by capturing individual sections,
 * ensuring each captured element image has a 16:9 aspect ratio via padding.
 *
 * @param {string[]} elementIdsToCapture Array of HTML element IDs to capture.
 * @param {object} filters The currently applied filters object.
 * @param {function} setIsExporting Callback function to set the exporting state (true/false).
 * @param {function} setError Callback function to set an error message.
 * @param {function} [setProgress] Optional callback for progress updates.
 */
export const exportDashboardToPDF = async (
    elementIdsToCapture,
    filters,
    setIsExporting,
    setError,
    setProgress
) => {
    console.log("Exporting PDF by elements (16:9 conversion)...");

    // --- Initial Setup (Validation, State, PDF, Header Content) ---
    if (!Array.isArray(elementIdsToCapture) || elementIdsToCapture.length === 0) {
        console.error("No element IDs provided for PDF export.");
        setError("Configuration error: No elements specified for export.");
        return;
    }
    setIsExporting(true);
    setError('');
    if (setProgress) setProgress({ current: 0, total: elementIdsToCapture.length });

    const now = new Date();
    const dateTimeString = now.toLocaleString();
    const filtersApplied = Object.entries(filters)
        // ... (filter formatting logic remains the same) ...
        .filter(([key, value]) => value && (!Array.isArray(value) || value.length > 0))
        .map(([key, value]) => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${Array.isArray(value) ? value.join(', ') : value}`)
        .join('\n');

    const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'pt',
        format: 'a4'
    });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 40;
    const availableWidth = pdfWidth - 2 * margin;
    let currentY = margin;
    const splitFilters = pdf.splitTextToSize(filtersApplied || 'None', availableWidth);
    currentY = addPdfHeader(pdf, currentY, dateTimeString, splitFilters);
    // --- End Initial Setup ---

    try {
        console.log("Starting element capture loop...");
        let elementIndex = 0;

        for (const elementId of elementIdsToCapture) {
            elementIndex++;
            if (setProgress) setProgress({ current: elementIndex, total: elementIdsToCapture.length, stage: `Capturing ${elementId}` });

            const element = document.getElementById(elementId);
            if (!element) {
                console.warn(`Element with ID '${elementId}' not found. Skipping.`);
                continue;
            }
            console.log(`Capturing element: #${elementId}`);

            // --- html2canvas Capture ---
            let sourceCanvas;
            try {
                 sourceCanvas = await html2canvas(element, {
                    useCORS: true,
                    backgroundColor: '#ffffff', // Set background for capture itself
                    scale: window.devicePixelRatio || 2, // Keep high-res capture
                    logging: false,
                });
            } catch (canvasError) {
                console.error(`html2canvas failed for element #${elementId}:`, canvasError);
                setError(`Error capturing element #${elementId}. Skipping.`);
                continue;
            }

            // --- Convert to 16:9 Canvas ---
            if (setProgress) setProgress({ current: elementIndex, total: elementIdsToCapture.length, stage: `Converting ${elementId} to 16:9` });
            const finalCanvas = convertTo16x9Canvas(sourceCanvas, '#ffffff'); // Use white padding

            // --- Get Image Data from the 16:9 Canvas ---
            // Use PNG for better quality of graphics/text
            const imgData = finalCanvas.toDataURL('image/png');
            const imgProps = pdf.getImageProperties(imgData); // Properties of the 16:9 image

            console.log(`16:9 Canvas (${imgProps.width}x${imgProps.height}) generated for #${elementId}, adding to PDF...`);

            // --- Scale 16:9 Image and Add to PDF ---
            // Scale the 16:9 image to fit the available PDF width
            const imgWidth = availableWidth;
            // Height will be calculated based on the 16:9 ratio and availableWidth
            const imgHeight = (imgProps.height * imgWidth) / imgProps.width; // or simply imgWidth * 9 / 16
            const spaceNeeded = imgHeight + 15; // Image height + spacing

            // --- Page Break Logic ---
            if (currentY + spaceNeeded > pdfHeight - margin) {
                console.log(`Adding new page for element #${elementId}`);
                pdf.addPage();
                currentY = margin;
                currentY = addPdfHeader(pdf, currentY, dateTimeString, splitFilters);
            }

            // Add the 16:9 image
            pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight);
            currentY += spaceNeeded;

            // Optional: Clean up canvases if memory becomes an issue, though JS garbage collection usually handles this.
            // sourceCanvas = null;
            // finalCanvas = null;

        } // End of loop

        // --- Save PDF ---
        console.log("Saving PDF...");
        if (setProgress) setProgress({ current: elementIdsToCapture.length, total: elementIdsToCapture.length, stage: "Saving PDF" });
        const filename = `GGBC_Dashboard_Export_${now.toISOString().split('T')[0]}_16x9.pdf`;
        pdf.save(filename);
        console.log("PDF Saved as", filename);

    } catch (err) {
        console.error("Error generating PDF:", err);
        setError(`Failed to generate PDF export: ${err.message || 'Unknown error'}`);
    } finally {
        setIsExporting(false);
        if (setProgress) setProgress(null);
    }
};