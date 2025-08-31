import { useEffect, useState } from 'react';

export default function ThemeToggle({ className = "" }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldDark = stored ? stored === 'dark' : prefersDark;
    setIsDark(shouldDark);
    document.documentElement.classList.toggle('dark', shouldDark);
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  return (
    <button onClick={toggle} aria-label="Toggle theme" className={`rounded-md border border-customGray-300 dark:border-customGray-600 px-2.5 py-1.5 text-xs text-customGray-700 dark:text-customGray-200 bg-white dark:bg-customGray-800 hover:bg-customGray-50 dark:hover:bg-customGray-700 focus:outline-none focus:ring-2 focus:ring-primary ${className}`}>
      {isDark ? (
        <span className="inline-flex items-center gap-1">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M21.64 13a9 9 0 11-10.63-10 7 7 0 1010.63 10z"/></svg>
          Dark
        </span>
      ) : (
        <span className="inline-flex items-center gap-1">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3a1 1 0 011 1v2a1 1 0 11-2 0V4a1 1 0 011-1zm5.66 2.34a1 1 0 011.41 1.41l-1.41 1.42a1 1 0 11-1.41-1.42l1.41-1.41zM21 11a1 1 0 110 2h-2a1 1 0 110-2h2zM7.34 5.34a1 1 0 00-1.41 1.41l1.41 1.42a1 1 0 001.41-1.42L7.34 5.34zM4 11a1 1 0 100 2H2a1 1 0 100-2h2zm3.34 7.66a1 1 0 001.41 0l1.41-1.41a1 1 0 10-1.41-1.42l-1.41 1.42a1 1 0 000 1.41zM11 18a1 1 0 112 0v2a1 1 0 11-2 0v-2zm7.66.66a1 1 0 000-1.41l-1.41-1.42a1 1 0 10-1.41 1.42l1.41 1.41a1 1 0 001.41 0z"/></svg>
          Light
        </span>
      )}
    </button>
  );
}

