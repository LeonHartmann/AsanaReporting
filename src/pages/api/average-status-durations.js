import { PrismaClient } from '@prisma/client';
import { differenceInSeconds } from 'date-fns';

function calculateTaskStatusDurations(statusHistory) {
  // console.log('[Debug] calculateTaskStatusDurations received history:', statusHistory);
  if (!statusHistory || statusHistory.length === 0) {
    return {};
  }

  // Sort by recorded_at ascending (ensure correct order)
  const sortedHistory = [...statusHistory].sort((a, b) => {
    try {
      // console.log(`[Debug] Sorting: a.recorded_at = ${a?.recorded_at}, b.recorded_at = ${b?.recorded_at}`);
      const dateA = a?.recorded_at ? new Date(a.recorded_at) : null;
      const dateB = b?.recorded_at ? new Date(b.recorded_at) : null;

      if (!dateA || !dateB || isNaN(dateA) || isNaN(dateB)) {
        // console.error("[Debug] Error during native date sort comparison:", { a_rec: a?.recorded_at, b_rec: b?.recorded_at });
        return 0; // Keep original order if dates are invalid
      }
      return dateA - dateB;
    } catch (e) {
      console.error("[Debug] Error during native date sort comparison:", e, { a_rec: a?.recorded_at, b_rec: b?.recorded_at });
      return 0;
    }
  });

  const durations = {};

  for (let i = 0; i < sortedHistory.length - 1; i++) {
    const currentEntry = sortedHistory[i];
    const nextEntry = sortedHistory[i + 1];

    // console.log(`[Debug] Calculating duration for interval: start=${currentEntry?.recorded_at}, end=${nextEntry?.recorded_at}`);

    try {
      const startDate = currentEntry?.recorded_at ? new Date(currentEntry.recorded_at) : null;
      const endDate = nextEntry?.recorded_at ? new Date(nextEntry.recorded_at) : null;

      if (!startDate || !endDate || isNaN(startDate) || isNaN(endDate)) {
        // console.warn(`[Debug] Skipping duration calculation (native) for interval in task ${currentEntry.task_id} due to invalid date(s):`,
        //   { start: currentEntry?.recorded_at, end: nextEntry?.recorded_at });
        continue; // Skip this interval if dates are invalid
      }

      const durationInSeconds = differenceInSeconds(endDate, startDate);

      if (durationInSeconds < 0) {
          // console.warn(`[Debug] Negative duration calculated for task ${currentEntry.task_id}, skipping interval:`, { start: startDate, end: endDate, duration: durationInSeconds });
          continue; // Skip negative durations
      }

      const status = currentEntry.status.trim(); // Trim whitespace
      durations[status] = (durations[status] || 0) + durationInSeconds;

    } catch (e) {
      // console.error(`[Debug] Error during native duration calculation for task ${currentEntry.task_id}:`, e,
      //   { start: currentEntry?.recorded_at, end: nextEntry?.recorded_at });
      // Continue processing other intervals even if one fails
    }
  }

  return durations;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  const prisma = new PrismaClient();

  try {
    // 1. Fetch all status history records
    const allHistory = await prisma.taskStatusHistory.findMany({
      select: {
        task_id: true,
        status: true,
        recorded_at: true,
      },
      orderBy: [
        { task_id: 'asc' },
        { recorded_at: 'asc' },
      ],
    });

    // 2. Group history by task_id
    const historyByTask = allHistory.reduce((acc, record) => {
      if (!acc[record.task_id]) {
        acc[record.task_id] = [];
      }
      acc[record.task_id].push(record);
      return acc;
    }, {});

    // 3. Calculate durations for each task
    const taskDurations = Object.values(historyByTask).map(taskHistory => {
      if (taskHistory.length > 0) {
          // console.log(`[Debug] Processing history for task_id: ${taskHistory[0].task_id}`);
      }
      return calculateTaskStatusDurations(taskHistory);
    });

    // 4. Aggregate durations across all tasks
    const aggregatedDurations = {};
    const statusCounts = {};

    taskDurations.forEach(durations => {
      for (const status in durations) {
        if (durations.hasOwnProperty(status)) {
          aggregatedDurations[status] = (aggregatedDurations[status] || 0) + durations[status];
          statusCounts[status] = (statusCounts[status] || 0) + 1; // Count how many tasks contributed to this status
        }
      }
    });

    // 5. Calculate average duration for each status (in seconds)
    const averageDurations = {};
    for (const status in aggregatedDurations) {
      if (statusCounts[status] > 0) {
        averageDurations[status] = aggregatedDurations[status] / statusCounts[status];
      }
    }

    res.status(200).json(averageDurations);

  } catch (error) {
    console.error('Error fetching or calculating average status durations:', error);
    res.status(500).json({ message: 'Failed to calculate average status durations' });
  } finally {
    await prisma.$disconnect();
  }
} 