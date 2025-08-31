// Lightweight, shared chart helpers to keep visuals consistent

export const isDarkMode = () =>
  typeof window !== 'undefined' && document.documentElement.classList.contains('dark');

export const getTextColor = () => (isDarkMode() ? '#e5e7eb' : '#374151');

export const getMutedTextColor = () => (isDarkMode() ? '#9ca3af' : '#6b7280');

export const getGridColor = () =>
  isDarkMode() ? 'rgba(75, 85, 99, 0.25)' : 'rgba(209, 213, 219, 0.35)';

// Create a vertical gradient for nicer fills/areas
export const createVerticalGradient = (ctx, area, from, to) => {
  const gradient = ctx.createLinearGradient(0, area.top, 0, area.bottom);
  gradient.addColorStop(0, from);
  gradient.addColorStop(1, to);
  return gradient;
};

// Observe dark-mode class toggles and run a callback (e.g., to update chart colors)
export const observeTheme = (onChange) => {
  if (typeof window === 'undefined') return () => {};
  const target = document.documentElement;
  const observer = new MutationObserver(() => onChange?.());
  observer.observe(target, { attributes: true, attributeFilter: ['class'] });
  return () => observer.disconnect();
};

// Recommended palette derived from Tailwind config used in app
export const palette = {
  primary: '#3b82f6',
  secondary: '#22c55e',
  warning: '#facc15',
  error: '#ef4444',
  purple: '#8b5cf6',
  orange: '#f97316',
  pink: '#ec4899',
  gray500: '#6b7280',
};

// Format numbers with locale separators
export const formatNumber = (n) =>
  typeof n === 'number' ? n.toLocaleString() : n;

// Simple drop-shadow plugin for bar charts
export const barShadowPlugin = {
  id: 'barShadow',
  beforeDatasetDraw(chart, args, pluginOptions) {
    const ctx = chart.ctx;
    ctx.save();
    ctx.shadowColor = (pluginOptions && pluginOptions.color) || 'rgba(0,0,0,0.08)';
    ctx.shadowBlur = (pluginOptions && pluginOptions.blur) || 6;
    ctx.shadowOffsetY = (pluginOptions && pluginOptions.offsetY) || 3;
    ctx.shadowOffsetX = (pluginOptions && pluginOptions.offsetX) || 0;
  },
  afterDatasetDraw(chart) {
    chart.ctx.restore();
  },
};
