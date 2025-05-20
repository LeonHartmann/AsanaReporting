import React from 'react';
import { Group } from '@visx/group';
import { Pie } from '@visx/shape';
import { scaleOrdinal } from '@visx/scale';
import { ParentSize } from '@visx/responsive';
import { useTooltip, TooltipWithBounds } from '@visx/tooltip';

const STATUS_COLORS = {
  'Completed': 'rgba(34, 197, 94, 0.7)',
  'Completed/Feedback': 'rgba(52, 211, 153, 0.7)',
  'In progress': 'rgba(59, 130, 246, 0.7)',
  'In Review': 'rgba(139, 92, 246, 0.7)',
  'To Do': 'rgba(234, 179, 8, 0.7)',
  'Awaiting Info': 'rgba(249, 115, 22, 0.7)',
  'Blocked': 'rgba(239, 68, 68, 0.7)',
  'No Status': 'rgba(107, 114, 128, 0.7)',
};
const DEFAULT_COLOR = 'rgba(107, 114, 128, 0.7)';

export default function CompletionStatusChart({ tasks, onClick, isFullscreen }) {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400">
        No task data available for chart.
      </div>
    );
  }

  const statusCounts = {};
  tasks.forEach((task) => {
    if (task.completed) {
      statusCounts['Completed'] = (statusCounts['Completed'] || 0) + 1;
      return;
    }

    let status = task.section_name || task.status || 'No Status';
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('in progress')) status = 'In progress';
    else if (lowerStatus.includes('review')) status = 'In Review';
    else if (lowerStatus.includes('todo') || lowerStatus.includes('to do')) status = 'To Do';
    else if (lowerStatus.includes('awaiting')) status = 'Awaiting Info';
    else if (lowerStatus.includes('feedback')) status = 'Completed/Feedback';
    else if (lowerStatus.includes('block')) status = 'Blocked';

    if (status === 'Completed/Feedback' && !task.completed) {
      statusCounts['Completed/Feedback'] = (statusCounts['Completed/Feedback'] || 0) + 1;
      return;
    }

    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  const data = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));
  const colorScale = scaleOrdinal({
    domain: data.map((d) => d.status),
    range: data.map((d) => STATUS_COLORS[d.status] || DEFAULT_COLOR),
  });

  const { tooltipData, tooltipLeft, tooltipTop, tooltipOpen, showTooltip, hideTooltip } =
    useTooltip();

  const containerClass = isFullscreen
    ? 'w-full h-full'
    : 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-xl shadow-lg ring-1 ring-gray-200 dark:ring-gray-700 h-96 cursor-pointer transition hover:shadow-xl';

  return (
    <div
      id="completion-status-chart"
      data-title="Task Status Distribution"
      className={containerClass}
      onClick={onClick}
    >
      <ParentSize>{({ width, height }) => {
        const radius = Math.min(width, height) / 2 - 10;
        return (
          <svg width={width} height={height} className="overflow-visible">
            <Group top={height / 2} left={width / 2}>
              <Pie
                data={data}
                pieValue={(d) => d.count}
                outerRadius={radius}
                innerRadius={radius * 0.6}
                cornerRadius={8}
                padAngle={0.02}
              >
                {(pie) =>
                  pie.arcs.map((arc) => (
                    <g key={arc.data.status}>
                      <path
                        d={pie.path(arc)}
                        fill={colorScale(arc.data.status)}
                        onMouseMove={(event) => {
                          const total = data.reduce((sum, d) => sum + d.count, 0);
                          const percent = Math.round((arc.data.count / total) * 100);
                          showTooltip({
                            tooltipLeft: event.clientX,
                            tooltipTop: event.clientY,
                            tooltipData: `${arc.data.status}: ${arc.data.count} (${percent}%)`,
                          });
                        }}
                        onMouseLeave={hideTooltip}
                      />
                    </g>
                  ))
                }
              </Pie>
            </Group>
          </svg>
        );
      }}</ParentSize>
      {tooltipOpen && (
        <TooltipWithBounds
          top={tooltipTop}
          left={tooltipLeft}
          style={{ borderRadius: 8, backgroundColor: '#1f2937', color: 'white', padding: '4px 8px' }}
        >
          {tooltipData}
        </TooltipWithBounds>
      )}
    </div>
  );
}
