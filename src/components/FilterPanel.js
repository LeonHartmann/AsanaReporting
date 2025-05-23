import React, { useState } from 'react';
import Select from 'react-select'; // Import react-select

export default function FilterPanel({ filters, setFilters, distinctValues, onApplyFilters, onResetFilters }) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Ensure assignee and taskType filters remain arrays
    if (name !== 'assignee' && name !== 'taskType') {
        setFilters(prevFilters => ({ ...prevFilters, [name]: value }));
    }
  };

  // Updated handler for react-select (multi and single)
  const handleSelectChange = (selectedOption, actionMeta) => {
    const { name } = actionMeta;
    let value;
    if (Array.isArray(selectedOption)) {
      // Handle multi-select: map selected options to an array of their values
      value = selectedOption.map(option => option.value);
    } else {
      // Handle single-select (or clear action): get the value or empty string
      value = selectedOption ? selectedOption.value : '';
    }
    setFilters(prevFilters => ({ ...prevFilters, [name]: value }));
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
    <form onSubmit={handleApply} className="bg-white dark:bg-customGray-800 p-4 rounded-lg shadow-sm mb-6 border border-customGray-200 dark:border-customGray-700">
      {/* Main Filters Row - Always Visible */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 items-end mb-3">
        {/* Brand Filter */}
        <div>
          <label htmlFor="brand-select" className="block text-xs font-medium text-customGray-700 dark:text-customGray-300 mb-1">
            Brand
          </label>
          <Select
            inputId="brand-select"
            isMulti
            name="brand"
            options={(distinctValues.brands || []).map(brand => ({ value: brand, label: brand }))}
            value={(filters.brand || []).map(b => ({ value: b, label: b }))}
            onChange={handleSelectChange}
            isClearable
            isSearchable
            placeholder="Select..."
            className="text-xs"
            classNamePrefix="react-select"
            styles={{
              control: (base, state) => ({
                ...base,
                backgroundColor: 'var(--select-bg, white)',
                borderColor: state.isFocused ? 'var(--select-border-focus, #3b82f6)' : 'var(--select-border, #d1d5db)',
                boxShadow: state.isFocused ? '0 0 0 1px var(--select-border-focus, #3b82f6)' : base.boxShadow,
                borderRadius: '0.375rem',
                minHeight: '32px',
                fontSize: '12px',
              }),
              valueContainer: (base) => ({ ...base, padding: '1px 6px'}),
              multiValue: (base) => ({ ...base, backgroundColor: 'var(--select-multivalue-bg, #e0e7ff)', borderRadius: '0.25rem', fontSize: '11px'}),
              input: (base) => ({ ...base, margin: '0px', fontSize: '12px' }),
              menu: (base) => ({ ...base, backgroundColor: 'var(--select-menu-bg, white)', borderRadius: '0.375rem', zIndex: 20, fontSize: '12px'}),
            }}
          />
        </div>

        {/* Asset Filter */}
        <div>
          <label htmlFor="asset-select" className="block text-xs font-medium text-customGray-700 dark:text-customGray-300 mb-1">
            Asset
          </label>
          <Select
            inputId="asset-select"
            isMulti
            name="asset"
            options={(distinctValues.assets || []).map(asset => ({ value: asset, label: asset }))}
            value={(filters.asset || []).map(a => ({ value: a, label: a }))}
            onChange={handleSelectChange}
            isClearable
            isSearchable
            placeholder="Select..."
            className="text-xs"
            classNamePrefix="react-select"
            styles={{
              control: (base, state) => ({
                ...base,
                backgroundColor: 'var(--select-bg, white)',
                borderColor: state.isFocused ? 'var(--select-border-focus, #3b82f6)' : 'var(--select-border, #d1d5db)',
                boxShadow: state.isFocused ? '0 0 0 1px var(--select-border-focus, #3b82f6)' : base.boxShadow,
                borderRadius: '0.375rem',
                minHeight: '32px',
                fontSize: '12px',
              }),
              valueContainer: (base) => ({ ...base, padding: '1px 6px'}),
              multiValue: (base) => ({ ...base, backgroundColor: 'var(--select-multivalue-bg, #e0e7ff)', borderRadius: '0.25rem', fontSize: '11px'}),
              input: (base) => ({ ...base, margin: '0px', fontSize: '12px' }),
              menu: (base) => ({ ...base, backgroundColor: 'var(--select-menu-bg, white)', borderRadius: '0.375rem', zIndex: 20, fontSize: '12px'}),
            }}
          />
        </div>

        {/* Start Date */}
        <div>
          <label htmlFor="startDate" className="block text-xs font-medium text-customGray-700 dark:text-customGray-300 mb-1">
            From Date
          </label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={filters.startDate || ''}
            onChange={handleInputChange}
            className="block w-full border border-customGray-300 dark:border-customGray-600 rounded-md py-1.5 px-2 text-xs text-customGray-900 dark:text-customGray-100 bg-white dark:bg-customGray-700 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          />
        </div>

        {/* End Date */}
        <div>
          <label htmlFor="endDate" className="block text-xs font-medium text-customGray-700 dark:text-customGray-300 mb-1">
            To Date
          </label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={filters.endDate || ''}
            onChange={handleInputChange}
            className="block w-full border border-customGray-300 dark:border-customGray-600 rounded-md py-1.5 px-2 text-xs text-customGray-900 dark:text-customGray-100 bg-white dark:bg-customGray-700 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          />
        </div>

        {/* Completion Status */}
        <div>
          <label htmlFor="completionFilter" className="block text-xs font-medium text-customGray-700 dark:text-customGray-300 mb-1">
            Status
          </label>
          <select
            id="completionFilter"
            name="completionFilter"
            value={filters.completionFilter || 'all'}
            onChange={handleInputChange}
            className="block w-full border border-customGray-300 dark:border-customGray-600 rounded-md py-1.5 px-2 text-xs text-customGray-900 dark:text-customGray-100 bg-white dark:bg-customGray-700 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          >
            <option value="all">All Tasks</option>
            <option value="only_completed">Only Completed</option>
            <option value="hide_completed">Hide Completed</option>
            <option value="only_completed_feedback">Only Completed/Feedback</option>
            <option value="hide_completed_feedback">Hide Completed/Feedback</option>
            <option value="only_completed_feedback_status">Only 'Completed/Feedback' Status</option>
            <option value="only_closed_won">Only 'CLOSED WON'</option>
            <option value="only_closed_lost">Only 'CLOSED LOST'</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            type="submit"
            className="px-3 py-1.5 text-xs font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 text-xs font-medium rounded-md text-customGray-700 dark:text-customGray-100 bg-customGray-100 dark:bg-customGray-700 hover:bg-customGray-200 dark:hover:bg-customGray-600 focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center px-3 py-1.5 text-xs font-medium rounded-md border transition-colors focus:outline-none focus:ring-1 focus:ring-primary ${
              showAdvanced 
                ? 'bg-primary text-white border-primary hover:bg-primary-dark' 
                : 'bg-white dark:bg-customGray-800 text-customGray-700 dark:text-customGray-300 border-customGray-300 dark:border-customGray-600 hover:bg-customGray-50 dark:hover:bg-customGray-700'
            }`}
          >
            <svg className={`w-3 h-3 mr-1 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            More
          </button>
        </div>
      </div>

      {/* Advanced Filters - Collapsible */}
      {showAdvanced && (
        <div className="border-t border-customGray-200 dark:border-customGray-700 pt-3 space-y-3">
          {/* Requested By */}
          <div>
            <label htmlFor="requester-select" className="block text-xs font-medium text-customGray-700 dark:text-customGray-300 mb-1">
              Requested By
            </label>
            <div className="max-w-xs">
              <Select
                inputId="requester-select"
                isMulti
                name="requester"
                options={(distinctValues.requesters || []).map(requester => ({ value: requester, label: requester }))}
                value={(filters.requester || []).map(r => ({ value: r, label: r }))}
                onChange={handleSelectChange}
                isClearable
                isSearchable
                placeholder="Search or select..."
                className="text-xs"
                classNamePrefix="react-select"
                styles={{
                  control: (base, state) => ({
                    ...base,
                    backgroundColor: 'var(--select-bg, white)',
                    borderColor: state.isFocused ? 'var(--select-border-focus, #3b82f6)' : 'var(--select-border, #d1d5db)',
                    boxShadow: state.isFocused ? '0 0 0 1px var(--select-border-focus, #3b82f6)' : base.boxShadow,
                    borderRadius: '0.375rem',
                    minHeight: '32px',
                    fontSize: '12px',
                  }),
                  valueContainer: (base) => ({ ...base, padding: '1px 6px'}),
                  multiValue: (base) => ({ ...base, backgroundColor: 'var(--select-multivalue-bg, #e0e7ff)', borderRadius: '0.25rem', fontSize: '11px'}),
                  input: (base) => ({ ...base, margin: '0px', fontSize: '12px' }),
                  menu: (base) => ({ ...base, backgroundColor: 'var(--select-menu-bg, white)', borderRadius: '0.375rem', zIndex: 20, fontSize: '12px'}),
                }}
              />
            </div>
          </div>

          {/* Assignee Multi-Select Buttons */}
          <div>
             <label className="block text-xs font-medium text-customGray-700 dark:text-customGray-300 mb-1">
                Assignee
             </label>
             <div className="flex flex-wrap gap-1.5">
                {(distinctValues.assignees || []).map((assignee) => {
                    const isSelected = (filters.assignee || []).includes(assignee);
                    return (
                        <button
                            key={assignee}
                            type="button"
                            onClick={() => handleAssigneeToggle(assignee)}
                            className={`py-1 px-2 rounded text-xs border transition-colors focus:outline-none focus:ring-1 focus:ring-primary/60 ${
                                isSelected 
                                    ? 'bg-primary text-white border-primary hover:bg-primary-dark' 
                                    : 'bg-customGray-100 dark:bg-customGray-700 text-customGray-800 dark:text-customGray-200 border-customGray-300 dark:border-customGray-600 hover:bg-customGray-200 dark:hover:bg-customGray-600'
                            }`}
                        >
                            {assignee}
                        </button>
                    );
                })}
             </div>
          </div>

          {/* Task Type Multi-Select Buttons */}
          <div>
              <label className="block text-xs font-medium text-customGray-700 dark:text-customGray-300 mb-1">
                  Task Type
              </label>
              <div className="flex flex-wrap gap-1.5">
                  {(distinctValues.taskTypes || []).map((taskType) => {
                      const isSelected = (filters.taskType || []).includes(taskType);
                      return (
                          <button
                              key={taskType}
                              type="button"
                              onClick={() => handleTaskTypeToggle(taskType)}
                              className={`py-1 px-2 rounded text-xs border transition-colors focus:outline-none focus:ring-1 focus:ring-primary/60 ${isSelected
                                      ? 'bg-primary text-white border-primary hover:bg-primary-dark'
                                      : 'bg-customGray-100 dark:bg-customGray-700 text-customGray-800 dark:text-customGray-200 border-customGray-300 dark:border-customGray-600 hover:bg-customGray-200 dark:hover:bg-customGray-600'
                                  }`}
                          >
                              {taskType}
                          </button>
                      );
                  })}
              </div>
          </div>
        </div>
      )}

      {/* Updated CSS Variables for react-select */}
      <style jsx global>{`
        html { /* Light mode defaults */
            --select-bg: #ffffff;
            --select-border: #d1d5db; /* customGray.300 */
            --select-border-focus: #3b82f6; /* primary */
            --select-border-hover: #9ca3af; /* customGray.400 */
            --select-text: #111827; /* customGray.900 */
            --select-menu-bg: #ffffff;
            --select-option-selected-bg: #3b82f6; /* primary */
            --select-option-focus-bg: #dbeafe; /* primary-lightest (blue-100) */
            --select-option-selected-text: #ffffff;
            --select-option-active-bg: #2563eb; /* primary-dark */
            --select-placeholder-text: #6b7280; /* customGray.500 */
            --select-multivalue-bg: #e0e7ff; /* indigo-100 for example */
            --select-multivalue-text: #3730a3; /* indigo-800 */
            --select-multivalue-remove-text: #4f46e5; /* indigo-600 */
            --select-multivalue-remove-hover-bg: #c7d2fe; /* indigo-200 */
            --select-multivalue-remove-hover-text: #3730a3; /* indigo-800 */
            --select-clear-indicator: #9ca3af; /* customGray.400 */
            --select-clear-indicator-hover: #ef4444; /* error */
            --select-dropdown-indicator: #9ca3af; /* customGray.400 */
            --select-dropdown-indicator-hover: #6b7280; /* customGray.500 */
        }
        html.dark {
            --select-bg: #1f2937; /* customGray.800 */
            --select-border: #4b5563; /* customGray.600 */
            --select-border-focus: #60a5fa; /* primary.light */
            --select-border-hover: #6b7280; /* customGray.500 */
            --select-text: #f3f4f6; /* customGray.100 */
            --select-menu-bg: #1f2937; /* customGray.800 */
            --select-option-selected-bg: #3b82f6; /* primary */
            --select-option-focus-bg: #374151; /* customGray.700 */
            --select-option-selected-text: #ffffff;
            --select-option-active-bg: #2563eb; /* primary.dark */
            --select-placeholder-text: #9ca3af; /* customGray.400 */
            --select-multivalue-bg: #374151; /* customGray.700 */
            --select-multivalue-text: #a5b4fc; /* indigo-300 */
            --select-multivalue-remove-text: #c7d2fe; /* indigo-200 */
            --select-multivalue-remove-hover-bg: #4338ca; /* indigo-700 */
            --select-multivalue-remove-hover-text: #e0e7ff; /* indigo-100 */
            --select-clear-indicator: #9ca3af; /* customGray.400 */
            --select-clear-indicator-hover: #f87171; /* error-light */
            --select-dropdown-indicator: #9ca3af; /* customGray.400 */
            --select-dropdown-indicator-hover: #d1d5db; /* customGray.300 */
        }
      `}</style>
    </form>
  );
}