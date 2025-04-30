import { format, differenceInDays, parseISO } from 'date-fns'; // Import necessary date functions

// Status columns mirroring TaskTable.js (ensure these names exactly match task properties)
const statusColumns = [
  '📃 To Do ',
  ' ☕️ Awaiting Info',
  '🎨 In progress',
  '📩 In Review ',
  '🌀 Completed/Feedback'
];

// Helper function to safely access nested properties and format values for CSV
const getSafeValue = (value) => {
  if (value === null || value === undefined) {
    return ''; // Return empty string for null/undefined
  }
  // Escape double quotes and handle commas for CSV
  const stringValue = String(value).replace(/"/g, '""');
  // Enclose in double quotes if it contains a comma, newline, or double quote
  if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
      return `"${stringValue}"`;
  }
  return stringValue; // Return as is if no special characters
};

// Specific formatter for dates
const formatDateValue = (dateString) => {
    if (!dateString) return '';
    try {
        return format(parseISO(dateString), 'yyyy-MM-dd HH:mm:ss');
    } catch (e) {
        console.warn("Invalid date for formatting:", dateString);
        return getSafeValue(dateString); // Return safe original value if formatting fails
    }
};

// Specific formatter for assignee
const formatAssignee = (assignee) => {
    if (!assignee) return '';
    if (typeof assignee === 'object' && assignee !== null && assignee.name) {
        return getSafeValue(assignee.name);
    }
    // If it's not an object with 'name', return its safe string representation
    return getSafeValue(assignee); 
};

// Specific formatter for custom fields
const formatCustomFields = (customFields) => {
    if (!Array.isArray(customFields) || customFields.length === 0) {
        return '';
    }
    // Join name and display value, separated by semicolon
    const formatted = customFields.map(cf => 
        `${cf.name || 'Unknown Field'}: ${cf.display_value || cf.text_value || cf.number_value || cf.enum_value?.name || 'N/A'}`
    ).join('; ');
    return getSafeValue(formatted);
};

// Calculate Open/Completed Duration in Days
const calculateDurationDays = (createdAt, completedAt, completed) => {
    if (!createdAt) return ''; // Need a creation date
    try {
        const startDate = parseISO(createdAt);
        let endDate;

        if (completed && completedAt) {
            endDate = parseISO(completedAt);
        } else if (!completed) {
            endDate = new Date(); // Use 'now' for open tasks
        } else {
            // Completed but no completedAt date
            return ''; 
        }
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || startDate > endDate) {
             return ''; // Invalid dates or start date after end date
        }
        
        const diff = differenceInDays(endDate, startDate);
        return diff >= 0 ? diff : 0; // Return duration in days, ensuring non-negative
    } catch (e) {
        console.error("Error calculating duration:", e);
        return ''; // Return empty on error
    }
};

/**
 * Generates a CSV string from an array of task objects and triggers download.
 * Includes calculated fields like time in status and open/completed duration.
 * @param {Array<Object>} tasks - The array of task objects to export.
 * @param {string} [filename='tasks_export.csv'] - The desired filename for the downloaded CSV.
 */
export function exportTasksToCSV(tasks, filename = 'tasks_export.csv') {
  if (!tasks || tasks.length === 0) {
    console.warn('No tasks provided for CSV export.');
    alert('No tasks available to export.');
    return;
  }

  // --- Define CSV Headers ---
  const baseHeaders = [
    'Task ID', 'Task Name', 'Assignee', 'Due Date', 'Completed', 'Completed At',
    'Created At', 'Brand', 'Asset', 'Requester', 'Task Type',
    'Status', 'Custom Fields' 
  ];
  // Add Time in Status headers (using seconds as unit)
  const statusDurationHeaders = statusColumns.map(status => `Time in ${status.trim()} (s)`);
  // Add Open/Completed Duration header
  const calculatedHeaders = ['Open/Completed Duration (days)'];

  const headers = [...baseHeaders, ...statusDurationHeaders, ...calculatedHeaders];

  // --- Create CSV Header Row ---
  const csvHeader = headers.map(h => getSafeValue(h)).join(',') + '\n'; // Ensure headers are safe too

  // --- Create CSV Rows ---
  const csvRows = tasks.map(task => {
    // Prepare data for each row
    const rowData = [
        getSafeValue(task.id),
        getSafeValue(task.name),
        formatAssignee(task.assignee), // Use specific formatter
        formatDateValue(task.deadline), // Use task.deadline for Due Date
        getSafeValue(task.completed),
        formatDateValue(task.completedAt), // Format date
        formatDateValue(task.createdAt), // Format date
        getSafeValue(task.brand),
        getSafeValue(task.asset),
        getSafeValue(task.requester),
        getSafeValue(task.taskType),
        getSafeValue(task.status), // Use task.status (mirroring TaskTable)
        formatCustomFields(task.custom_fields), // Use specific formatter
    ];
    
    // Add Time in Status values (raw seconds)
    const statusDurationValues = statusColumns.map(status => {
        // Get raw duration in seconds, default to 0 if missing/null/undefined
        const duration = task[status]; 
        return (duration === null || duration === undefined || isNaN(Number(duration))) ? '' : Number(duration); 
    });

    // Add Calculated Duration value
    const openCompletedDuration = calculateDurationDays(task.createdAt, task.completedAt, task.completed);

    // Combine all parts of the row
    return [...rowData, ...statusDurationValues, openCompletedDuration].join(',');
    
  }).join('\n');

  // Combine header and rows
  const csvString = csvHeader + csvRows;

  // Create a Blob and trigger download
  const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel

  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    alert('CSV export is not supported in your browser.');
  }
} 