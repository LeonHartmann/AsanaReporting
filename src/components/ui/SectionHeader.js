export default function SectionHeader({ title, subtitle, actions, className = "" }) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 ${className}`}>
      <div>
        <h2 className="text-2xl font-semibold text-customGray-900 dark:text-customGray-100">{title}</h2>
        {subtitle && (
          <p className="text-base text-customGray-500 dark:text-customGray-400">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
