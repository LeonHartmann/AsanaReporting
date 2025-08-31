import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// ChartJS registration is already done in other chart files, 
// but it's safe to include here too. It won't re-register.
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

import { getTextColor, observeTheme, createVerticalGradient, formatNumber, barShadowPlugin } from './chartUtils';

export default function TasksByAssigneeChart({ tasks, onClick, isFullscreen }) {
  if (!tasks || tasks.length === 0) {
    return <div className="text-center text-customGray-500 dark:text-customGray-400 py-10">No task data available for chart.</div>;
  }

  // Calculate task counts per assignee
  const assigneeCounts = tasks.reduce((acc, task) => {
    // Use 'Unassigned' if task.assignee is null/undefined or if name is missing
    const assignee = task.assignee || 'Unassigned'; 
    acc[assignee] = (acc[assignee] || 0) + 1;
    return acc;
  }, {});

  // Sort assignees by task count descending for better visualization
  const sortedAssignees = Object.entries(assigneeCounts)
    .sort(([, countA], [, countB]) => countB - countA);

  // For normal view, show top 8 assignees only
  const maxItems = isFullscreen ? sortedAssignees.length : 8;
  const displayData = sortedAssignees.slice(0, maxItems);

  const labels = displayData.map(([assignee]) => assignee);
  const dataCounts = displayData.map(([, count]) => count);

  const data = {
    labels,
    datasets: [
      {
        label: 'Tasks Count',
        data: dataCounts,
        backgroundColor: (ctx) => {
          const { chart } = ctx;
          const { ctx: c, chartArea } = chart;
          if (!chartArea) return '#8b5cf6';
          return createVerticalGradient(c, chartArea, 'rgba(139,92,246,0.95)', 'rgba(139,92,246,0.65)');
        },
        borderWidth: 0, // Remove borders
        borderColor: 'transparent',
        borderRadius: 6,
        categoryPercentage: 0.7,
        barPercentage: 0.7,
        barThickness: isFullscreen ? 18 : 14,
      },
    ],
  };

  const textColor = getTextColor();

  // Chart options optimized for clean design like screenshot
  const options = {
    indexAxis: 'y', // Horizontal bars
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'none', // Disable hover interactions
    },
    hover: {
      mode: 'none', // Disable hover effects
    },
    animation: {
      duration: 0, // No animations
    },
    transitions: {
      active: {
        animation: {
          duration: 0, // No hover animations
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        display: false, // Hide x-axis for cleaner look
      },
      y: {
        ticks: {
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: isFullscreen ? 14 : 15,
            weight: '500',
          },
          color: textColor,
          callback: function(value) {
            return this.getLabelForValue ? this.getLabelForValue(value) : value;
          },
          padding: 12,
        },
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
      }
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
        text: 'Tasks by Assignee',
        align: 'center',
        font: {
          family: 'Inter, system-ui, sans-serif',
          size: isFullscreen ? 24 : 20,
          weight: '600',
        },
        color: textColor,
        padding: {
          top: 0,
          bottom: 25,
        }
      },
      tooltip: { enabled: false },
      barShadow: { color: 'rgba(0,0,0,0.08)', blur: 6, offsetY: 3 },
    },
    layout: {
      padding: {
        top: isFullscreen ? 15 : 25,
        right: isFullscreen ? 60 : 60, // Space for numbers on the right
        bottom: 15,
        left: isFullscreen ? 15 : 20,
      }
    },
    elements: {
      bar: {
        borderWidth: 0,
        borderRadius: 6,
        borderSkipped: false,
      }
    },
  };

  // Register custom plugin for number labels
  const customLabelsPlugin = {
    id: 'customLabels',
    afterDatasetsDraw: (chart) => {
      const ctx = chart.ctx;
      const datasets = chart.data.datasets;
      const meta = chart.getDatasetMeta(0); // Use the first (and only) dataset
      
      meta.data.forEach((bar, index) => {
        const value = datasets[0].data[index]; // Get value from the first dataset
        
        // Position for number to the right of the bar
        const x = bar.x + 8;
        const y = bar.y;
        
        // Draw number (theme-aware)
        ctx.fillStyle = getTextColor();
        ctx.font = `600 ${isFullscreen ? '15px' : '14px'} Inter, system-ui, sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(formatNumber(value), x, y);
      });
    }
  };

  // Custom container class
  const containerClass = isFullscreen
    ? "w-full h-full flex flex-col bg-white dark:bg-customGray-800"
    : "p-4 h-80 cursor-pointer relative";

  const chartRef = React.useRef(null);

  // Update chart colors on theme change
  React.useEffect(() => {
    const chart = chartRef.current;
    if (chart) {
      const newTextColor = getTextColor();
      if (chart.options.plugins.title) {
        chart.options.plugins.title.color = newTextColor;
      }
      chart.options.scales.y.ticks.color = newTextColor;
      chart.update('none');
    }
    const disconnect = observeTheme(() => {
      const ch = chartRef.current;
      if (ch) {
        const c = getTextColor();
        if (ch.options.plugins.title) ch.options.plugins.title.color = c;
        ch.options.scales.y.ticks.color = c;
        ch.update('none');
      }
    });
    return disconnect;
  }, [isFullscreen]);

  // Normal view - simplified chart
  if (!isFullscreen) {
    return (
      <div
        id="tasks-by-assignee-chart"
        data-title="Tasks by Assignee"
        className={containerClass}
        onClick={onClick}
      >
        <div className="h-full">
          <Bar 
            key={`assignee-chart-normal-${sortedAssignees.length}`}
            ref={chartRef} 
            data={data} 
            options={options} 
            plugins={[customLabelsPlugin, barShadowPlugin]}
            style={{
              border: 'none',
              outline: 'none',
              boxShadow: 'none'
            }}
          />
        </div>
        {sortedAssignees.length > maxItems && (
          <div className="absolute bottom-2 left-0 right-0 text-center text-xs text-customGray-500 dark:text-customGray-400">
            Showing top {maxItems} of {sortedAssignees.length} assignees. Click to see all assignees.
          </div>
        )}
      </div>
    );
  }

  // Fullscreen view
  return (
    <div
      id="tasks-by-assignee-chart-fullscreen"
      data-title="Tasks by Assignee"
      className={containerClass}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-6 border-b border-customGray-200 dark:border-customGray-700">
        <h2 className="text-2xl font-semibold text-customGray-900 dark:text-customGray-100 mb-4">Tasks by Assignee</h2>
        <div className="text-sm text-customGray-600 dark:text-customGray-300">
          Showing all {sortedAssignees.length} assignees
        </div>
      </div>

      <div className="flex-1 p-6">
        <div style={{ height: `${Math.max(400, sortedAssignees.length * 40)}px` }}>
          <Bar 
            key={`assignee-chart-fullscreen-${sortedAssignees.length}`}
            ref={chartRef} 
            data={data} 
            options={options} 
            plugins={[customLabelsPlugin, barShadowPlugin]}
            style={{
              border: 'none',
              outline: 'none',
              boxShadow: 'none'
            }}
          />
        </div>
      </div>
    </div>
  );
}
