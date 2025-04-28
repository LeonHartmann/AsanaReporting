import React from 'react';

export default function FilterPanel({ filters, setFilters, distinctValues, onApplyFilters, onResetFilters }) {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters(prevFilters => ({ ...prevFilters, [name]: value }));
  };

  const handleApply = (e) => {
      e.preventDefault();
      onApplyFilters();
  }

  const handleReset = () => {
    // Call the reset handler passed from the parent dashboard page
    if (onResetFilters) {
        onResetFilters();
    } else {
        // Fallback if handler not provided (though it should be)
        setFilters({ brand: '', asset: '', requester: '', assignee: '', startDate: '', endDate: '' });
        onApplyFilters({ brand: '', asset: '', requester: '', assignee: '', startDate: '', endDate: '' }); 
    }
  };

  return (
    <form onSubmit={handleApply} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-6">
      {/* Use Flexbox for a single row layout, allowing wrapping */}
      <div className="flex flex-wrap gap-4 items-end">
        {/* Brand Filter */}
        <div className="flex-grow md:flex-grow-0 md:w-48"> {/* Adjust width as needed */}
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
        <div className="flex-grow md:flex-grow-0 md:w-48"> {/* Adjust width as needed */}
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
        <div className="flex-grow md:flex-grow-0 md:w-48"> {/* Adjust width as needed */}
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

        {/* Assignee Filter */}
        <div className="flex-grow md:flex-grow-0 md:w-48"> {/* Adjust width as needed */}
          <label htmlFor="assignee" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Assignee
          </label>
          <select
            id="assignee"
            name="assignee"
            value={filters.assignee}
            onChange={handleInputChange}
            className="shadow-sm block w-full border rounded py-2 px-3 text-gray-700 dark:text-gray-300 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">All Assignees</option>
            {distinctValues.assignees?.map((assignee) => (
              <option key={assignee} value={assignee}>{assignee}</option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div className="flex-grow md:flex-grow-0 md:w-48"> {/* Adjust width as needed */}
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
        <div className="flex-grow md:flex-grow-0 md:w-48"> {/* Adjust width as needed */}
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
        <div className="flex-grow md:flex-grow-0 md:w-48"> {/* Adjust width as needed */}
          <label htmlFor="completionFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Completion Status
          </label>
          <select
            id="completionFilter"
            name="completionFilter"
            value={filters.completionFilter || ''}
            onChange={handleInputChange}
            className="shadow-sm block w-full border rounded py-2 px-3 text-gray-700 dark:text-gray-300 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">All Tasks</option>
            <option value="hide_completed">Hide Completed</option>
            <option value="only_completed">Only Completed</option>
          </select>
        </div>

        {/* Action Buttons - aligned to the end */}
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
      </div> {/* End Flexbox container */}
    </form>
  );
} 