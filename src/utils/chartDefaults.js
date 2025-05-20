import { Chart as ChartJS } from 'chart.js';

// Set global font family and color for a modern look
ChartJS.defaults.font.family = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';
ChartJS.defaults.color = '#374151'; // gray-700
ChartJS.defaults.borderColor = 'rgba(229, 231, 235, 0.3)'; // gray-200

// Modernize tooltip and legend styling
ChartJS.defaults.plugins.legend.position = 'bottom';
ChartJS.defaults.plugins.tooltip.backgroundColor = 'rgba(17, 24, 39, 0.8)';
ChartJS.defaults.plugins.tooltip.borderRadius = 4;
ChartJS.defaults.plugins.tooltip.titleFont = { weight: '600' };

// Apply rounded bars and thicker line width
ChartJS.defaults.elements.bar.borderRadius = 6;
ChartJS.defaults.elements.line.borderWidth = 3;

export {}; // This module only sets defaults
