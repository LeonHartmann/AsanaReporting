/**
 * Filters tasks based on provided filter criteria
 * 
 * @param {Array} tasks - Array of task objects to filter
 * @param {Object} filters - Filter criteria
 * @param {string|null} filters.assignee - Assignee to filter by (null means no filter)
 * @returns {Array} Filtered tasks
 */
export function filterTasks(tasks, filters = {}) {
  if (!tasks || !Array.isArray(tasks)) {
    return [];
  }

  return tasks.filter(task => {
    // Filter by assignee if assignee filter is set
    if (filters.assignee && (task.assignee || 'Unassigned') !== filters.assignee) {
      return false;
    }

    // Task passed all filters
    return true;
  });
} 