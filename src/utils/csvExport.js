import { format } from 'date-fns'; // For formatting dates

// Helper function to safely access nested properties and format values
const getTaskValue = (task, field) => {
  const value = task[field];
  if (value === null || value === undefined) {
    return ''; // Return empty string for null/undefined
  }
  if (field === 'createdAt' || field === 'completedAt' || field === 'dueDate') {
    try {
      // Format dates, handle invalid dates gracefully
      return value ? format(new Date(value), 'yyyy-MM-dd HH:mm:ss') : '';
    } catch (e) {
      console.warn(`Invalid date format for field ${field}:`, value);
      return value; // Return original value if formatting fails
    }
  }
  if (field === 'custom_fields' && Array.isArray(value)) {
    // Simple example: Join custom field names and values
    // Adjust this based on how you want to represent custom fields in CSV
    return value.map(cf => `${cf.name}: ${cf.display_value || cf.text_value || cf.number_value || cf.enum_value?.name || ''}`).join('; ');
  }
  if (typeof value === 'object') {
     // Handle simple objects like assignee (if it's { gid: '...', name: '...' })
     if (value.name) return value.name; 
     // Fallback for other objects - convert to JSON string
     return JSON.stringify(value); 
  }
  // Escape quotes within a value by doubling them
  const stringValue = String(value);
  return `"${stringValue.replace(/"/g, '""')}"`; // Enclose in quotes and escape existing quotes
};

/**
 * Generates a CSV string from an array of task objects and triggers download.
 * @param {Array<Object>} tasks - The array of task objects to export.
 * @param {string} [filename='tasks_export.csv'] - The desired filename for the downloaded CSV.
 */
export function exportTasksToCSV(tasks, filename = 'tasks_export.csv') {
  if (!tasks || tasks.length === 0) {
    console.warn('No tasks provided for CSV export.');
    // Optionally show a user message here instead of just logging
    alert('No tasks available to export.'); 
    return;
  }

  // Define CSV Headers - Adjust based on the actual fields in your task objects
  const headers = [
    'Task ID', 'Task Name', 'Assignee', 'Due Date', 'Completed', 'Completed At', 
    'Created At', 'URL', 'Brand', 'Asset', 'Requester', 'Task Type', 
    'Current Status', 'Custom Fields' // Add other relevant headers
  ];
  
  // Map task fields to headers (ensure order matches headers)
  const fields = [
    'id', 'name', 'assignee', 'dueOn', 'completed', 'completedAt', 
    'createdAt', 'permalink_url', 'brand', 'asset', 'requester', 'taskType', 
    'currentStatus', 'custom_fields' // Ensure these keys exist in your task objects
  ];

  // Create CSV header row
  const csvHeader = headers.join(',') + '\n';

  // Create CSV rows from tasks
  const csvRows = tasks.map(task => {
    return fields.map(field => getTaskValue(task, field)).join(',');
  }).join('\n');

  // Combine header and rows
  const csvString = csvHeader + csvRows;

  // Create a Blob for the CSV data
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });

  // Create a link element to trigger the download
  const link = document.createElement('a');
  if (link.download !== undefined) { // Feature detection
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Clean up the object URL
  } else {
    // Fallback for older browsers (less common now)
    alert('CSV export is not supported in your browser.');
  }
} 