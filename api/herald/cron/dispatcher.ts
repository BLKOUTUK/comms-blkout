/**
 * Cron Dispatcher
 * Handle scheduled cron jobs dispatching
 */

import type { VercelResponse } from '@vercel/node';
import { runHeraldWeekly, runHeraldMonthly, runListenerResearch } from './jobs.js';

/**
 * Handle scheduled cron jobs - single dispatcher handles all schedules
 */
export async function handleCronJob(jobType: string, res: VercelResponse) {
  console.log(`[Cron] Running job: ${jobType}`);

  // For daily dispatcher, check what jobs should run today
  if (jobType === 'daily-dispatch') {
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0=Sunday, 5=Friday
    const dayOfMonth = now.getUTCDate();
    const hour = now.getUTCHours();

    const results: { job: string; success: boolean; preview?: string }[] = [];

    // Listener research runs every day at 7am UTC
    if (hour >= 7 && hour < 12) {
      const listenerResult = await runListenerResearch();
      results.push({ job: 'listener-research', success: true, preview: listenerResult.slice(0, 100) });
    }

    // Herald weekly runs on Fridays (dayOfWeek=5) at 9am UTC
    if (dayOfWeek === 5 && hour >= 9 && hour < 12) {
      const weeklyResult = await runHeraldWeekly();
      results.push({ job: 'herald-weekly', success: true, preview: weeklyResult.slice(0, 100) });
    }

    // Herald monthly runs on 1st of month at 10am UTC
    if (dayOfMonth === 1 && hour >= 10 && hour < 14) {
      const monthlyResult = await runHeraldMonthly();
      results.push({ job: 'herald-monthly', success: true, preview: monthlyResult.slice(0, 100) });
    }

    if (results.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No jobs scheduled for this time',
        time: { dayOfWeek, dayOfMonth, hour }
      });
    }

    return res.status(200).json({ success: true, jobs_run: results });
  }

  // Direct job execution (for testing)
  if (jobType === 'herald-weekly') {
    const content = await runHeraldWeekly();
    return res.status(200).json({ success: true, type: 'herald-weekly', preview: content.slice(0, 200) });
  }

  if (jobType === 'herald-monthly') {
    const content = await runHeraldMonthly();
    return res.status(200).json({ success: true, type: 'herald-monthly', preview: content.slice(0, 200) });
  }

  if (jobType === 'listener-research') {
    const content = await runListenerResearch();
    return res.status(200).json({ success: true, type: 'listener-research', preview: content.slice(0, 200) });
  }

  return res.status(400).json({ error: 'Unknown cron job type' });
}
