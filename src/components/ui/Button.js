export default function Button({ variant = "primary", size = "sm", className = "", children, ...props }) {
  const base = "inline-flex items-center justify-center font-medium rounded-md focus:outline-none focus:ring-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = {
    xs: "text-xs px-2 py-1",
    sm: "text-xs px-3 py-1.5",
    md: "text-sm px-3.5 py-2",
  };
  const variants = {
    primary: "text-white bg-primary hover:bg-primary-dark focus:ring-primary",
    secondary: "text-customGray-800 dark:text-customGray-100 bg-customGray-100 dark:bg-customGray-700 hover:bg-customGray-200 dark:hover:bg-customGray-600 focus:ring-customGray-400",
    outline: "text-customGray-700 dark:text-customGray-200 border border-customGray-300 dark:border-customGray-600 bg-white dark:bg-customGray-800 hover:bg-customGray-50 dark:hover:bg-customGray-700 focus:ring-primary",
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

