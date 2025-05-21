import React from 'react';
import Select from 'react-select'; // Import react-select

export default function FilterPanel({ filters, setFilters, distinctValues, onApplyFilters, onResetFilters }) {
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
    <form onSubmit={handleApply} className="bg-white dark:bg-customGray-800 p-6 rounded-xl shadow-lg mb-8 font-sans"> {/* Updated container styles */}
      {/* Row 1: Original Filters (excluding assignee dropdown) + Buttons */}
      <div className="flex flex-wrap gap-6 items-end mb-6"> {/* Increased gap and mb */}
        {/* Brand Filter (using react-select) */}
        <div className="flex-grow md:flex-grow-0 md:w-52"> {/* Increased width */}
          <label htmlFor="brand-select" className="block text-sm font-medium text-customGray-700 dark:text-customGray-300 mb-1.5"> {/* Updated label styles */}
            Brand
          </label>
          <Select
            inputId="brand-select"
            isMulti // Enable multi-select
            name="brand"
            options={ // No 'All Brands' needed for multi-select
                (distinctValues.brands || []).map(brand => ({ value: brand, label: brand }))
            }
            // Value is now an array of {value, label} objects
            value={(filters.brand || []).map(b => ({ value: b, label: b }))}
            onChange={handleSelectChange}
            isClearable
            isSearchable
            placeholder="Search or select..."
            className="shadow-sm text-customGray-700 dark:text-customGray-100 sm:text-sm" /* Updated text color */
            classNamePrefix="react-select"
            styles={{
              control: (base, state) => ({
                ...base,
                backgroundColor: 'var(--select-bg, white)',
                borderColor: state.isFocused ? 'var(--select-border-focus, #3b82f6)' : 'var(--select-border, #d1d5db)', // primary, customGray.300
                boxShadow: state.isFocused ? '0 0 0 1px var(--select-border-focus, #3b82f6)' : base.boxShadow,
                borderRadius: '0.375rem', // rounded-md
                minHeight: '38px', // Ensure consistent height with other inputs
                '&:hover': {
                  borderColor: state.isFocused ? 'var(--select-border-focus, #3b82f6)' : 'var(--select-border-hover, #9ca3af)', // customGray.400
                }
              }),
              valueContainer: (base) => ({ ...base, padding: '2px 8px'}),
              multiValue: (base) => ({ ...base, backgroundColor: 'var(--select-multivalue-bg, #e0e7ff)', borderRadius: '0.25rem'}), // primary-lightest bg
              multiValueLabel: (base) => ({ ...base, color: 'var(--select-multivalue-text, #3730a3)'}), // primary-darker text
              multiValueRemove: (base) => ({ ...base, color: 'var(--select-multivalue-remove-text, #4f46e5)', '&:hover': { backgroundColor: 'var(--select-multivalue-remove-hover-bg, #c7d2fe)', color: 'var(--select-multivalue-remove-hover-text, #3730a3)'}}),
              input: (base) => ({ ...base, margin: '0px', paddingBottom: '0px', paddingTop: '0px', color: 'var(--select-text, #111827)' }),
              menu: (base) => ({ ...base, backgroundColor: 'var(--select-menu-bg, white)', borderRadius: '0.375rem', zIndex: 20}),
              option: (base, state) => ({
                ...base,
                backgroundColor: state.isSelected ? 'var(--select-option-selected-bg, #3b82f6)' : state.isFocused ? 'var(--select-option-focus-bg, #dbeafe)' : 'var(--select-menu-bg, white)', // primary, primary-lightest
                color: state.isSelected ? 'var(--select-option-selected-text, white)' : 'var(--select-text, #111827)',
                '&:active': { backgroundColor: 'var(--select-option-active-bg, #2563eb)'}, // primary-dark
              }),
              placeholder: (base) => ({ ...base, color: 'var(--select-placeholder-text, #6b7280)'}), // customGray.500
              clearIndicator: (base) => ({ ...base, color: 'var(--select-clear-indicator, #9ca3af)', '&:hover': {color: 'var(--select-clear-indicator-hover, #ef4444)'}}),
              dropdownIndicator: (base) => ({ ...base, color: 'var(--select-dropdown-indicator, #9ca3af)', '&:hover': {color: 'var(--select-dropdown-indicator-hover, #6b7280)'}}),
            }}
          />
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
        </div>

        {/* Asset Filter (using react-select) */}
        <div className="flex-grow md:flex-grow-0 md:w-52">
          <label htmlFor="asset-select" className="block text-sm font-medium text-customGray-700 dark:text-customGray-300 mb-1.5">
            Asset
          </label>
          <Select
            inputId="asset-select"
            isMulti // Enable multi-select
            name="asset"
            options={ // No 'All Assets' needed for multi-select
                (distinctValues.assets || []).map(asset => ({ value: asset, label: asset }))
            }
            // Value is now an array of {value, label} objects
            value={(filters.asset || []).map(a => ({ value: a, label: a }))}
            onChange={handleSelectChange}
            isClearable
            isSearchable
            placeholder="Search or select..."
            className="shadow-sm text-customGray-700 dark:text-customGray-100 sm:text-sm" /* Updated text color */
            classNamePrefix="react-select"
            styles={{ /* Reusing styles from Brand, defined above via CSS variables */
              control: (base, state) => ({ ...base, backgroundColor: 'var(--select-bg, white)', borderColor: state.isFocused ? 'var(--select-border-focus, #3b82f6)' : 'var(--select-border, #d1d5db)', boxShadow: state.isFocused ? '0 0 0 1px var(--select-border-focus, #3b82f6)' : base.boxShadow, borderRadius: '0.375rem', minHeight: '38px', '&:hover': { borderColor: state.isFocused ? 'var(--select-border-focus, #3b82f6)' : 'var(--select-border-hover, #9ca3af)', } }),
              valueContainer: (base) => ({ ...base, padding: '2px 8px'}),
              multiValue: (base) => ({ ...base, backgroundColor: 'var(--select-multivalue-bg, #e0e7ff)', borderRadius: '0.25rem'}),
              multiValueLabel: (base) => ({ ...base, color: 'var(--select-multivalue-text, #3730a3)'}),
              multiValueRemove: (base) => ({ ...base, color: 'var(--select-multivalue-remove-text, #4f46e5)', '&:hover': { backgroundColor: 'var(--select-multivalue-remove-hover-bg, #c7d2fe)', color: 'var(--select-multivalue-remove-hover-text, #3730a3)'}}),
              input: (base) => ({ ...base, margin: '0px', paddingBottom: '0px', paddingTop: '0px', color: 'var(--select-text, #111827)' }),
              menu: (base) => ({ ...base, backgroundColor: 'var(--select-menu-bg, white)', borderRadius: '0.375rem', zIndex: 20}),
              option: (base, state) => ({ ...base, backgroundColor: state.isSelected ? 'var(--select-option-selected-bg, #3b82f6)' : state.isFocused ? 'var(--select-option-focus-bg, #dbeafe)' : 'var(--select-menu-bg, white)', color: state.isSelected ? 'var(--select-option-selected-text, white)' : 'var(--select-text, #111827)', '&:active': { backgroundColor: 'var(--select-option-active-bg, #2563eb)'}, }),
              placeholder: (base) => ({ ...base, color: 'var(--select-placeholder-text, #6b7280)'}),
              clearIndicator: (base) => ({ ...base, color: 'var(--select-clear-indicator, #9ca3af)', '&:hover': {color: 'var(--select-clear-indicator-hover, #ef4444)'}}),
              dropdownIndicator: (base) => ({ ...base, color: 'var(--select-dropdown-indicator, #9ca3af)', '&:hover': {color: 'var(--select-dropdown-indicator-hover, #6b7280)'}}),
            }}
          />
        </div>

        {/* Requester Filter (using react-select) */}
        <div className="flex-grow md:flex-grow-0 md:w-52">
          <label htmlFor="requester-select" className="block text-sm font-medium text-customGray-700 dark:text-customGray-300 mb-1.5">
            Requested By
          </label>
          <Select
            inputId="requester-select"
            isMulti // Enable multi-select
            name="requester"
            options={ // No 'All Requesters' needed for multi-select
                (distinctValues.requesters || []).map(requester => ({ value: requester, label: requester }))
            }
            // Value is now an array of {value, label} objects
            value={(filters.requester || []).map(r => ({ value: r, label: r }))}
            onChange={handleSelectChange}
            isClearable
            isSearchable
            placeholder="Search or select..."
            className="shadow-sm text-customGray-700 dark:text-customGray-100 sm:text-sm" /* Updated text color */
            classNamePrefix="react-select"
            styles={{ /* Reusing styles from Brand, defined above via CSS variables */
              control: (base, state) => ({ ...base, backgroundColor: 'var(--select-bg, white)', borderColor: state.isFocused ? 'var(--select-border-focus, #3b82f6)' : 'var(--select-border, #d1d5db)', boxShadow: state.isFocused ? '0 0 0 1px var(--select-border-focus, #3b82f6)' : base.boxShadow, borderRadius: '0.375rem', minHeight: '38px', '&:hover': { borderColor: state.isFocused ? 'var(--select-border-focus, #3b82f6)' : 'var(--select-border-hover, #9ca3af)', } }),
              valueContainer: (base) => ({ ...base, padding: '2px 8px'}),
              multiValue: (base) => ({ ...base, backgroundColor: 'var(--select-multivalue-bg, #e0e7ff)', borderRadius: '0.25rem'}),
              multiValueLabel: (base) => ({ ...base, color: 'var(--select-multivalue-text, #3730a3)'}),
              multiValueRemove: (base) => ({ ...base, color: 'var(--select-multivalue-remove-text, #4f46e5)', '&:hover': { backgroundColor: 'var(--select-multivalue-remove-hover-bg, #c7d2fe)', color: 'var(--select-multivalue-remove-hover-text, #3730a3)'}}),
              input: (base) => ({ ...base, margin: '0px', paddingBottom: '0px', paddingTop: '0px', color: 'var(--select-text, #111827)' }),
              menu: (base) => ({ ...base, backgroundColor: 'var(--select-menu-bg, white)', borderRadius: '0.375rem', zIndex: 20}),
              option: (base, state) => ({ ...base, backgroundColor: state.isSelected ? 'var(--select-option-selected-bg, #3b82f6)' : state.isFocused ? 'var(--select-option-focus-bg, #dbeafe)' : 'var(--select-menu-bg, white)', color: state.isSelected ? 'var(--select-option-selected-text, white)' : 'var(--select-text, #111827)', '&:active': { backgroundColor: 'var(--select-option-active-bg, #2563eb)'}, }),
              placeholder: (base) => ({ ...base, color: 'var(--select-placeholder-text, #6b7280)'}),
              clearIndicator: (base) => ({ ...base, color: 'var(--select-clear-indicator, #9ca3af)', '&:hover': {color: 'var(--select-clear-indicator-hover, #ef4444)'}}),
              dropdownIndicator: (base) => ({ ...base, color: 'var(--select-dropdown-indicator, #9ca3af)', '&:hover': {color: 'var(--select-dropdown-indicator-hover, #6b7280)'}}),
            }}
          />
        </div>

        {/* Start Date */}
        <div className="flex-grow md:flex-grow-0 md:w-52">
          <label htmlFor="startDate" className="block text-sm font-medium text-customGray-700 dark:text-customGray-300 mb-1.5">
            From Date
          </label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={filters.startDate || ''}
            onChange={handleInputChange}
            className="shadow-sm block w-full border border-customGray-300 dark:border-customGray-600 rounded-md py-2 px-3 text-customGray-900 dark:text-customGray-100 bg-white dark:bg-customGray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm"
            placeholder="dd.mm.yyyy"
          />
        </div>

        {/* End Date */}
        <div className="flex-grow md:flex-grow-0 md:w-52">
          <label htmlFor="endDate" className="block text-sm font-medium text-customGray-700 dark:text-customGray-300 mb-1.5">
            To Date
          </label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={filters.endDate || ''}
            onChange={handleInputChange}
            className="shadow-sm block w-full border border-customGray-300 dark:border-customGray-600 rounded-md py-2 px-3 text-customGray-900 dark:text-customGray-100 bg-white dark:bg-customGray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm"
            placeholder="dd.mm.yyyy"
          />
        </div>

        {/* Completion Filter */}
        <div className="flex-grow md:flex-grow-0 md:w-52">
          <label htmlFor="completionFilter" className="block text-sm font-medium text-customGray-700 dark:text-customGray-300 mb-1.5">
            Completion Status
          </label>
          <select
            id="completionFilter"
            name="completionFilter"
            value={filters.completionFilter || 'all'}
            onChange={handleInputChange}
            className="shadow-sm block w-full border border-customGray-300 dark:border-customGray-600 rounded-md py-2 px-3 text-customGray-900 dark:text-customGray-100 bg-white dark:bg-customGray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm"
          >
            <option value="all">All Tasks</option>
            <option value="only_completed">Only Completed (Checkbox)</option>
            <option value="hide_completed">Hide Completed (Checkbox)</option>
            <option value="only_completed_feedback">Only Completed (Checkbox) or '🌀 Feedback' Status</option>
            <option value="hide_completed_feedback">Hide Completed (Checkbox) and '🌀 Feedback' Status</option>
            <option value="only_completed_feedback_status">Only '🌀 Completed/Feedback' Status</option>
            <option value="only_closed_won">Only '🟢 CLOSED WON' Status</option>
            <option value="only_closed_lost">Only '🔴 CLOSED LOST' Status</option>
          </select>
        </div>

        {/* Action Buttons - Remain in the first row */}
        <div className="flex space-x-3 self-end"> {/* Increased space-x */}
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light transition-colors duration-150"
          >
            Apply Filters
          </button>
           <button
            type="button"
            onClick={handleReset}
            className="inline-flex justify-center py-2 px-4 border border-customGray-300 dark:border-customGray-500 shadow-sm text-sm font-medium rounded-md text-customGray-700 dark:text-customGray-100 bg-customGray-100 dark:bg-customGray-700 hover:bg-customGray-200 dark:hover:bg-customGray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light transition-colors duration-150"
          >
            Reset
          </button>
        </div>
      </div> {/* End Row 1 */}

      {/* Row 2: Assignee Multi-Select Buttons */}
      <div className="mb-6"> {/* Increased margin bottom */}
         <label className="block text-sm font-medium text-customGray-700 dark:text-customGray-300 mb-2">
            Assignee (select multiple)
         </label>
         <div className="flex flex-wrap gap-2.5"> {/* Increased gap */}
            {(distinctValues.assignees || []).map((assignee) => {
                const isSelected = (filters.assignee || []).includes(assignee);
                return (
                    <button
                        key={assignee}
                        type="button"
                        onClick={() => handleAssigneeToggle(assignee)}
                        className={`py-1.5 px-3.5 rounded-md text-sm border transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/60 dark:focus:ring-primary-light/60 ${
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
      </div> {/* End Row 2 */}

      {/* Row 3: Task Type Multi-Select Buttons */}
      <div>
          <label className="block text-sm font-medium text-customGray-700 dark:text-customGray-300 mb-2">
              Task Type (select multiple)
          </label>
          <div className="flex flex-wrap gap-2.5"> {/* Increased gap */}
              {(distinctValues.taskTypes || []).map((taskType) => {
                  const isSelected = (filters.taskType || []).includes(taskType);
                  return (
                      <button
                          key={taskType}
                          type="button"
                          onClick={() => handleTaskTypeToggle(taskType)}
                          className={`py-1.5 px-3.5 rounded-md text-sm border transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/60 dark:focus:ring-primary-light/60 ${isSelected
                                  ? 'bg-primary text-white border-primary hover:bg-primary-dark'
                                  : 'bg-customGray-100 dark:bg-customGray-700 text-customGray-800 dark:text-customGray-200 border-customGray-300 dark:border-customGray-600 hover:bg-customGray-200 dark:hover:bg-customGray-600'
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