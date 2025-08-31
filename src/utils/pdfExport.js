import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Utilities
const margin = 40;
const createPdf = () => new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

const drawHeader = (pdf, title, filtersText) => {
  const width = pdf.internal.pageSize.getWidth();
  const now = new Date().toLocaleString();

  pdf.setFontSize(18);
  pdf.setFont(undefined, 'bold');
  pdf.text(title, width / 2, margin, { align: 'center' });

  pdf.setFontSize(9);
  pdf.setFont(undefined, 'normal');
  pdf.text(`Generated: ${now}`, width - margin, margin, { align: 'right' });
  if (filtersText) {
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'bold');
    pdf.text('Filters', margin, margin);
    pdf.setFont(undefined, 'normal');
    const wrapped = pdf.splitTextToSize(filtersText, width - 2 * margin);
    pdf.text(wrapped, margin, margin + 14);
    return margin + 14 + wrapped.length * 10 + 10;
  }
  return margin + 10;
};

// KPI calculations sourced from dashboard logic
const calcKpis = (tasks, avgCycleTime) => {
  if (!tasks || tasks.length === 0) return { completed: 0, incomplete: 0, waitingFeedback: 0, overdue: 0, total: 0, avgCycleTime: avgCycleTime ?? null };
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let completed = 0, incomplete = 0, waitingFeedback = 0, overdue = 0;
  for (const t of tasks) {
    if (t.status === '🌀 Completed/Feedback') { waitingFeedback++; continue; }
    if (t.completed) { completed++; continue; }
    incomplete++;
    if (t.deadline) {
      const d = new Date(t.deadline);
      const nd = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      if (nd < today) overdue++;
    }
  }
  return { completed, incomplete, waitingFeedback, overdue, total: tasks.length, avgCycleTime: avgCycleTime ?? null };
};

const statusKeys = [
  { key: '📃 To Do ', label: 'To Do' },
  { key: ' ☕️ Awaiting Info', label: 'Awaiting Info' },
  { key: '🎨 In progress', label: 'In Progress' },
  { key: '📩 In Review ', label: 'In Review' },
  { key: '🌀 Completed/Feedback', label: 'Complete/Feedback' },
];

const calcStatusAverages = (tasks) => {
  const sums = {}; const counts = {};
  statusKeys.forEach(({ key }) => { sums[key] = 0; counts[key] = 0; });
  tasks?.forEach(t => {
    statusKeys.forEach(({ key }) => {
      const v = parseFloat(t[key]);
      if (!Number.isNaN(v) && v >= 0) { sums[key] += v; counts[key] += 1; }
    });
  });
  return statusKeys
    .filter(({ key }) => counts[key] > 0)
    .map(({ key, label }) => ({ label, seconds: Math.round(sums[key] / counts[key]) }));
};

const fmtDuration = (s) => {
  if (s == null || Number.isNaN(s)) return 'N/A';
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  return parts.join(' ') || '0m';
};

const nf = new Intl.NumberFormat();

const addKpiGrid = (pdf, y, kpis) => {
  const w = pdf.internal.pageSize.getWidth();
  const col = (w - 2 * margin) / 6;
  // tile background
  pdf.setDrawColor(235);
  for (let i = 0; i < 6; i++) {
    const x = margin + i * col + 6;
    pdf.roundedRect(x, y - 24, col - 12, 54, 6, 6, 'S');
  }
  pdf.setFont(undefined, 'bold');
  pdf.setFontSize(22);
  const vals = [nf.format(kpis.completed), nf.format(kpis.incomplete), nf.format(kpis.waitingFeedback), nf.format(kpis.overdue), kpis.avgCycleTime != null ? `${kpis.avgCycleTime} d` : 'N/A', nf.format(kpis.total)];
  const labels = ['Completed', 'Incomplete', 'Waiting', 'Overdue', 'Avg Time', 'Total'];
  vals.forEach((v, i) => {
    const x = margin + i * col + col / 2;
    pdf.text(String(v), x, y, { align: 'center' });
  });
  pdf.setFont(undefined, 'normal');
  pdf.setFontSize(10);
  labels.forEach((l, i) => {
    const x = margin + i * col + col / 2;
    pdf.text(l.toUpperCase(), x, y + 14, { align: 'center' });
  });
  return y + 28;
};

const addStatusTiles = (pdf, startY, averages) => {
  const w = pdf.internal.pageSize.getWidth();
  const tileW = (w - 2 * margin - 4 * 12) / 5; // 5 columns with 12pt gap
  let x = margin;
  let y = startY;
  pdf.setFontSize(10);
  averages.forEach(({ label, seconds }, idx) => {
    // box
    pdf.setDrawColor(235);
    pdf.roundedRect(x, y, tileW, 48, 6, 6, 'S');
    // label
    pdf.text(label.toUpperCase(), x + 10, y + 16);
    // value
    pdf.setFont(undefined, 'bold');
    pdf.setFontSize(14);
    pdf.text(fmtDuration(seconds), x + tileW - 10, y + 30, { align: 'right' });
    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(10);
    // next tile position
    x += tileW + 12;
    if ((idx + 1) % 5 === 0) { x = margin; y += 60; }
  });
  return y + 60;
};

// Simple lists for top entities (text, crisp)
const topCounts = (arr, key, limit = 10) => {
  const map = new Map();
  arr.forEach(t => {
    const k = (t[key] || 'N/A').toString();
    map.set(k, (map.get(k) || 0) + 1);
  });
  return Array.from(map.entries()).sort((a,b)=>b[1]-a[1]).slice(0, limit);
};

const addTwoColumnTopLists = (pdf, y, tasks) => {
  const w = pdf.internal.pageSize.getWidth();
  const colW = (w - 2 * margin - 20) / 2;
  const left = topCounts(tasks, 'brand', 10);
  const right = topCounts(tasks, 'assignee', 10);

  pdf.setFont(undefined, 'bold');
  pdf.setFontSize(12);
  pdf.text('Top Brands', margin, y);
  pdf.text('Top Assignees', margin + colW + 20, y);

  pdf.setFont(undefined, 'normal');
  pdf.setFontSize(10);
  let ly = y + 14;
  left.forEach(([name, count]) => { pdf.text(`${name}`, margin, ly); pdf.text(nf.format(count), margin + colW - 10, ly, { align: 'right' }); ly += 12; });
  let ry = y + 14;
  right.forEach(([name, count]) => { pdf.text(`${name}`, margin + colW + 20, ry); pdf.text(nf.format(count), margin + colW + 20 + colW - 10, ry, { align: 'right' }); ry += 12; });
  return Math.max(ly, ry) + 6;
};

const captureElement = async (id) => {
  const el = document.getElementById(id);
  if (!el) return null;
  const canvas = await html2canvas(el, { backgroundColor: '#ffffff', scale: window.devicePixelRatio || 2, logging: false });
  return canvas.toDataURL('image/png');
};

const addImageFullWidth = (pdf, imgData, y) => {
  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();
  const available = width - 2 * margin;
  const props = pdf.getImageProperties(imgData);
  const imgH = (props.height * available) / props.width;
  if (y + imgH > height - margin) { pdf.addPage(); y = margin; }
  pdf.addImage(imgData, 'PNG', margin, y, available, imgH);
  return y + imgH + 14;
};

// New: Management‑style PDF export
export const exportDashboardToPDF = async (filters, tasks, avgCycleTime, setIsExporting, setError, setProgress) => {
  try {
    setIsExporting?.(true);
    setError?.('');
    const pdf = createPdf();
    const filtersText = Object.entries(filters || {})
      .filter(([k, v]) => v && (!Array.isArray(v) || v.length))
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
      .join('\n');

    let y = drawHeader(pdf, 'GGBC Management Report', filtersText);

    // KPIs
    const kpis = calcKpis(tasks || [], avgCycleTime ?? null);
    y = addKpiGrid(pdf, y + 10, kpis);

    // Average time in status
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    pdf.text('Average Time In Status', margin, y + 18);
    const averages = calcStatusAverages(tasks || []);
    y = addStatusTiles(pdf, y + 26, averages);

    // Top lists
    y = addTwoColumnTopLists(pdf, y + 6, tasks || []);

    // Charts page(s)
    const chartIds = [
      'completion-status-chart',
      'tasks-by-deadline-chart',
      'tasks-by-brand-chart',
      'tasks-by-assignee-chart',
    ];
    // Layout as two per row where possible
    const width = pdf.internal.pageSize.getWidth();
    const height = pdf.internal.pageSize.getHeight();
    const available = width - 2 * margin;
    const colW = (available - 12) / 2;
    let col = 0;
    for (let i = 0; i < chartIds.length; i++) {
      setProgress?.({ current: i + 1, total: chartIds.length, stage: `Capturing ${chartIds[i]}` });
      const img = await captureElement(chartIds[i]);
      if (!img) continue;
      const props = pdf.getImageProperties(img);
      const imgH = (props.height * colW) / props.width;
      if (y + imgH > height - margin) { pdf.addPage(); y = margin; col = 0; }
      const x = margin + (col === 0 ? 0 : colW + 12);
      pdf.addImage(img, 'PNG', x, y, colW, imgH);
      col = (col + 1) % 2;
      if (col === 0) y += imgH + 14;
    }

    // Save
    const filename = `GGBC_Management_Report_${new Date().toISOString().slice(0,10)}.pdf`;
    pdf.save(filename);
  } catch (err) {
    console.error('PDF export error:', err);
    setError?.(err.message || 'Failed to export PDF');
  } finally {
    setIsExporting?.(false);
    setProgress?.(null);
  }
};
