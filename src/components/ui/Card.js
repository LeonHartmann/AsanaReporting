export default function Card({ title, subtitle, actions, children, className = "" }) {
  return (
    <div className={`bg-white dark:bg-customGray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow ${className}`}>
      {(title || actions || subtitle) && (
        <div className="px-5 py-4 flex items-start justify-between gap-4">
          <div>
            {title && <h3 className="text-base sm:text-lg font-semibold text-customGray-900 dark:text-customGray-100">{title}</h3>}
            {subtitle && <p className="mt-1 text-sm text-customGray-500 dark:text-customGray-400">{subtitle}</p>}
          </div>
          {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
