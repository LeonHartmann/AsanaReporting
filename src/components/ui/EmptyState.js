export default function EmptyState({ title = "Nothing to show", description = "Try adjusting filters or syncing.", icon = null, className = "" }) {
  return (
    <div className={`text-center py-10 text-customGray-600 dark:text-customGray-400 ${className}`}>
      {icon || (
        <svg className="mx-auto h-8 w-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M9 8h6m2 12H7a2 2 0 01-2-2V6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v10a2 2 0 01-2 2z" />
        </svg>
      )}
      <h3 className="text-sm font-medium text-customGray-900 dark:text-customGray-100">{title}</h3>
      <p className="text-xs text-customGray-500 dark:text-customGray-400 mt-1">{description}</p>
    </div>
  );
}

