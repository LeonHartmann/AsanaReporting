import React from 'react';

export default function FilterPanel({ filters, setFilters, distinctValues, onApplyFilters, onResetFilters }) {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Ensure assignee and taskType filters remain arrays
    if (name !== 'assignee' && name !== 'taskType') {
        setFilters(prevFilters => ({ ...prevFilters, [name]: value }));
    }
  };

  // New handler for toggling assignee selection
  const handleAssigneeToggle = (assigneeToToggle) => {
    setFilters(prevFilters => {
      const currentAssignees = prevFilters.assignee || []; // Ensure it's an array
      const isSelected = currentAssignees.includes(assigneeToToggle);
      let newAssignees;
      if (isSelected) {
        // Remove assignee
        newAssignees = currentAssignees.filter(name => name !== assigneeToToggle);
      } else {
        // Add assignee
        newAssignees = [...currentAssignees, assigneeToToggle];
      }
      return { ...prevFilters, assignee: newAssignees };
    });
    // Optional: Trigger apply filters immediately on toggle, or wait for Apply button
    // onApplyFilters({ ...filters, assignee: newAssignees }); 
  };

  // Handler for toggling task type selection
  const handleTaskTypeToggle = (taskTypeToToggle) => {
    setFilters(prevFilters => {
      const currentTaskTypes = prevFilters.taskType || []; // Ensure it's an array
      const isSelected = currentTaskTypes.includes(taskTypeToToggle);
      let newTaskTypes;
      if (isSelected) {
        // Remove task type
        newTaskTypes = currentTaskTypes.filter(type => type !== taskTypeToToggle);
      } else {
        // Add task type
        newTaskTypes = [...currentTaskTypes, taskTypeToToggle];
      }
      return { ...prevFilters, taskType: newTaskTypes };
    });
  };


  const handleApply = (e) => {
      e.preventDefault();
      onApplyFilters(); // Apply filters including the current assignee and taskType arrays
  }

  const handleReset = () => {
    if (onResetFilters) {
        onResetFilters(); // Parent handles resetting assignee and taskType to []
    } else {
        // Fallback shouldn't ideally be needed if dashboard provides handler
        const defaultFilters = { brand: '', asset: '', requester: '', assignee: [], taskType: [], startDate: '', endDate: '', completionFilter: '' }; // Added taskType
        setFilters(defaultFilters);
        onApplyFilters(defaultFilters); 
    }
  };

  return (
    <form onSubmit={handleApply} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-6">
      {/* Row 1: Original Filters (excluding assignee dropdown) + Buttons */}
      <div className="flex flex-wrap gap-4 items-end mb-4"> {/* Added mb-4 for spacing */}
        {/* Brand Filter */}
        <div className="flex-grow md:flex-grow-0 md:w-48">
          <label htmlFor="brand" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Brand
          </label>
          <select
            id="brand"
            name="brand"
            value={filters.brand}
            onChange={handleInputChange}
            className="shadow-sm block w-full border rounded py-2 px-3 text-gray-700 dark:text-gray-300 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">All Brands</option>
            {distinctValues.brands?.map((brand) => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
        </div>

        {/* Asset Filter */}
        <div className="flex-grow md:flex-grow-0 md:w-48">
          <label htmlFor="asset" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Asset
          </label>
          <select
            id="asset"
            name="asset"
            value={filters.asset}
            onChange={handleInputChange}
            className="shadow-sm block w-full border rounded py-2 px-3 text-gray-700 dark:text-gray-300 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">All Assets</option>
            {distinctValues.assets?.map((asset) => (
              <option key={asset} value={asset}>{asset}</option>
            ))}
          </select>
        </div>

        {/* Requester Filter */}
        <div className="flex-grow md:flex-grow-0 md:w-48">
          <label htmlFor="requester" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Requested By
          </label>
          <select
            id="requester"
            name="requester"
            value={filters.requester}
            onChange={handleInputChange}
            className="shadow-sm block w-full border rounded py-2 px-3 text-gray-700 dark:text-gray-300 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">All Requesters</option>
            {distinctValues.requesters?.map((requester) => (
              <option key={requester} value={requester}>{requester}</option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div className="flex-grow md:flex-grow-0 md:w-48">
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            From Date
          </label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={filters.startDate || ''}
            onChange={handleInputChange}
            className="shadow-sm block w-full border rounded py-2 px-3 text-gray-700 dark:text-gray-300 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="dd.mm.yyyy" /* Added placeholder */
          />
        </div>

        {/* End Date */}
        <div className="flex-grow md:flex-grow-0 md:w-48">
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            To Date
          </label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={filters.endDate || ''}
            onChange={handleInputChange}
            className="shadow-sm block w-full border rounded py-2 px-3 text-gray-700 dark:text-gray-300 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="dd.mm.yyyy" /* Added placeholder */
          />
        </div>

        {/* Completion Filter */}
        <div className="flex-grow md:flex-grow-0 md:w-48">
          <label htmlFor="completionFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Completion Status
          </label>
          <select
            id="completionFilter"
            name="completionFilter"
            value={filters.completionFilter || 'all'} /* Default to 'all' */
            onChange={handleInputChange}
            className="shadow-sm block w-full border rounded py-2 px-3 text-gray-700 dark:text-gray-300 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="all">All Tasks</option>
            <option value="only_completed">Only Completed (Checkbox)</option>
            <option value="hide_completed">Hide Completed (Checkbox)</option>
            <option value="only_completed_feedback">Only Completed (Checkbox) or '🌀 Feedback' Status</option>
            <option value="hide_completed_feedback">Hide Completed (Checkbox) and '🌀 Feedback' Status</option>
            <option value="only_closed_won">Only '🟢 CLOSED WON' Status</option>
            <option value="only_closed_lost">Only '🔴 CLOSED LOST' Status</option>
          </select>
        </div>

        {/* Action Buttons - Remain in the first row */}
        <div className="flex space-x-2 self-end">
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Apply Filters
          </button>
           <button
            type="button"
            onClick={handleReset}
            className="inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Reset
          </button>
        </div>
      </div> {/* End Row 1 */}

      {/* Row 2: Assignee Multi-Select Buttons */}
      <div className="mb-4"> {/* Added margin bottom */}
         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> {/* Added mb-2 */}
            Assignee (select multiple)
         </label>
         <div className="flex flex-wrap gap-2">
            {(distinctValues.assignees || []).map((assignee) => {
                const isSelected = (filters.assignee || []).includes(assignee);
                return (
                    <button
                        key={assignee}
                        type="button" // Important: prevent form submission
                        onClick={() => handleAssigneeToggle(assignee)}
                        className={`py-1 px-3 rounded-md text-sm border ${
                            isSelected 
                                ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700' 
                                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                        }`}
                    >
                        {assignee}
                    </button>
                );
            })}
         </div>
      </div> {/* End Row 2 */}

      {/* Row 3: Task Type Multi-Select Buttons */}
      <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Task Type (select multiple)
          </label>
          <div className="flex flex-wrap gap-2">
              {(distinctValues.taskTypes || []).map((taskType) => {
                  const isSelected = (filters.taskType || []).includes(taskType);
                  return (
                      <button
                          key={taskType}
                          type="button" // Important: prevent form submission
                          onClick={() => handleTaskTypeToggle(taskType)}
                          className={`py-1 px-3 rounded-md text-sm border ${isSelected
                                  ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
                                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                              }`}
                      >
                          {taskType}
                      </button>
                  );
              })}
          </div>
      </div> {/* End Row 3 */}

    </form>
  );
} 