import React, { useMemo } from 'react';

// Local helpers
const dot = (color) => (
  <span className={`inline-block w-2 h-2 rounded-full ${color}`} />
);

const formatSeconds = (seconds) => {
  if (seconds < 0 || seconds == null || Number.isNaN(seconds)) return 'N/A';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  let out = '';
  if (d) out += `${d}d `;
  if (h) out += `${h}h `;
  if (m) out += `${m}m`;
  return out.trim() || '0m';
};

const STATUS_CONFIG = [
  { key: '📃 To Do ', label: 'To Do', color: 'bg-gray-400' },
  { key: ' ☕️ Awaiting Info', label: 'Awaiting Info', color: 'bg-orange-500' },
  { key: '🎨 In progress', label: 'In Progress', color: 'bg-blue-500' },
  { key: '📩 In Review ', label: 'In Review', color: 'bg-yellow-500' },
  { key: '🌀 Completed/Feedback', label: 'Complete/Feedback', color: 'bg-green-500' },
];

export default function AnalyticsOverview({ tasks = [], avgCycleTime, isLoading }) {
  // KPI stats
  const stats = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return { completed: 0, incomplete: 0, overdue: 0, waitingFeedback: 0, total: 0 };
    }
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let overdue = 0, completed = 0, incomplete = 0, waitingFeedback = 0;
    tasks.forEach((task) => {
      if (task.status === '🌀 Completed/Feedback') { waitingFeedback++; return; }
      if (task.completed) { completed++; return; }
      incomplete++;
      if (!task.deadline) return;
      const d = new Date(task.deadline);
      if (Number.isNaN(d.getTime())) return;
      const nd = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      if (nd < today) overdue++;
    });
    return { completed, incomplete, overdue, waitingFeedback, total: tasks.length };
  }, [tasks]);

  // Average time in status (seconds)
  const averages = useMemo(() => {
    if (!tasks || tasks.length === 0) return [];
    const sum = {}; const count = {};
    STATUS_CONFIG.forEach(({ key }) => { sum[key] = 0; count[key] = 0; });
    tasks.forEach((t) => {
      STATUS_CONFIG.forEach(({ key }) => {
        const v = parseFloat(t[key]);
        if (!Number.isNaN(v) && v >= 0) { sum[key] += v; count[key] += 1; }
      });
    });
    return STATUS_CONFIG
      .filter(({ key }) => count[key] > 0)
      .map(({ key, label, color }) => ({ label, color, seconds: sum[key] / count[key] }));
  }, [tasks]);

  return (
    <section className="rounded-2xl bg-gradient-to-b from-white to-gray-50 dark:from-customGray-800 dark:to-customGray-800/60 shadow-sm ring-1 ring-black/5 dark:ring-white/10 px-5 sm:px-6 md:px-8 py-6 md:py-7">
      {/* Heading */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-customGray-900 dark:text-customGray-100">Analytics Overview</h2>
        <p className="text-sm text-customGray-500 dark:text-customGray-400">Stage duration focus with secondary KPIs</p>
      </div>

      {/* Primary: stage averages as tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5">
        {averages.map(({ label, color, seconds }) => (
          <div key={label} className="rounded-xl bg-white/80 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 p-4 md:p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${color}`} />
                <span className="text-xs uppercase tracking-wide text-customGray-600 dark:text-customGray-300">{label}</span>
              </div>
              <div className="text-2xl md:text-3xl font-semibold text-customGray-900 dark:text-customGray-100">{formatSeconds(seconds)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="mt-5 mb-4 border-t border-customGray-200/70 dark:border-customGray-700/60" />

      {/* Secondary: KPIs as centered tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-5">
        <div className="rounded-xl bg-white/80 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 p-4 md:p-5 text-center">
          <div className="text-2xl md:text-3xl font-semibold">{stats.completed}</div>
          <div className="mt-1 flex items-center justify-center gap-2 text-customGray-600 dark:text-customGray-300 text-[10px] sm:text-xs uppercase tracking-wide">
            {dot('bg-green-500')}<span>Completed</span>
          </div>
        </div>
        <div className="rounded-xl bg-white/80 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 p-4 md:p-5 text-center">
          <div className="text-2xl md:text-3xl font-semibold">{stats.incomplete}</div>
          <div className="mt-1 flex items-center justify-center gap-2 text-customGray-600 dark:text-customGray-300 text-[10px] sm:text-xs uppercase tracking-wide">
            {dot('bg-blue-500')}<span>Incomplete</span>
          </div>
        </div>
        <div className="rounded-xl bg-white/80 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 p-4 md:p-5 text-center">
          <div className="text-2xl md:text-3xl font-semibold">{stats.waitingFeedback}</div>
          <div className="mt-1 flex items-center justify-center gap-2 text-customGray-600 dark:text-customGray-300 text-[10px] sm:text-xs uppercase tracking-wide">
            {dot('bg-yellow-500')}<span>Waiting Feedback</span>
          </div>
        </div>
        <div className="rounded-xl bg-white/80 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 p-4 md:p-5 text-center">
          <div className={`text-2xl md:text-3xl font-semibold ${stats.overdue>0?'text-red-600 dark:text-red-400':''}`}>{stats.overdue}</div>
          <div className="mt-1 flex items-center justify-center gap-2 text-customGray-600 dark:text-customGray-300 text-[10px] sm:text-xs uppercase tracking-wide">
            {dot('bg-red-500')}<span>Overdue</span>
          </div>
        </div>
        <div className="rounded-xl bg-white/80 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 p-4 md:p-5 text-center">
          <div className="text-2xl md:text-3xl font-semibold">{isLoading ? '…' : (avgCycleTime!=null?`${avgCycleTime} d`:'N/A')}</div>
          <div className="mt-1 flex items-center justify-center gap-2 text-customGray-600 dark:text-customGray-300 text-[10px] sm:text-xs uppercase tracking-wide">
            {dot('bg-purple-500')}<span>Avg Time</span>
          </div>
        </div>
        <div className="rounded-xl bg-white/80 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 p-4 md:p-5 text-center">
          <div className="text-2xl md:text-3xl font-semibold">{stats.total}</div>
          <div className="mt-1 flex items-center justify-center gap-2 text-customGray-600 dark:text-customGray-300 text-[10px] sm:text-xs uppercase tracking-wide">
            {dot('bg-indigo-500')}<span>Total</span>
          </div>
        </div>
      </div>
    </section>
  );
}
