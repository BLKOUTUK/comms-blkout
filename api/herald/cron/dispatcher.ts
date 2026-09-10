/**
 * Cron Dispatcher
 * Handle scheduled cron jobs dispatching
 *
 * Nothing schedules this. It is reachable at GET /api/herald/generate?job=<type>
 * and only runs when that URL is hit by hand.
 *
 * A job that could not generate is never reported as a success: it answers 502 with
 * the reason, and in the daily dispatch it is listed with `success: false` and its
 * reason while the other jobs still run.
 */

import type { VercelResponse } from '@vercel/node';
import { runHeraldWeekly, runHeraldMonthly, runListenerResearch, generationFailureReason } from './jobs.js';
import { runMetricsSync } from '../handlers/metrics-sync.js';

type JobResult = { job: string; success: boolean; preview?: string; error?: string };

/**
 * Run one job and record what actually happened — never a hardcoded success.
 */
async function runJob(job: string, run: () => Promise<string>): Promise<JobResult> {
  try {
    const output = await run();
    return { job, success: true, preview: output.slice(0, 100) };
  } catch (error) {
    const reason = generationFailureReason(error);
    console.error(`[Cron] ${job} failed: ${reason}`);
    return { job, success: false, error: reason };
  }
}

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

    const results: JobResult[] = [];

    // Metrics sync runs every day at 8am UTC
    if (hour >= 8 && hour < 12) {
      results.push(await runJob('metrics-sync', runMetricsSync));
    }

    // Listener research runs every day at 7am UTC
    if (hour >= 7 && hour < 12) {
      results.push(await runJob('listener-research', runListenerResearch));
    }

    // Herald weekly runs on Fridays (dayOfWeek=5) at 9am UTC
    if (dayOfWeek === 5 && hour >= 9 && hour < 12) {
      results.push(await runJob('herald-weekly', runHeraldWeekly));
    }

    // Herald monthly runs on 1st of month at 10am UTC
    if (dayOfMonth === 1 && hour >= 10 && hour < 14) {
      results.push(await runJob('herald-monthly', runHeraldMonthly));
    }

    if (results.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No jobs scheduled for this time',
        time: { dayOfWeek, dayOfMonth, hour }
      });
    }

    const failed = results.filter(r => !r.success);
    if (failed.length > 0) {
      return res.status(502).json({
        success: false,
        error: failed.map(f => `${f.job}: ${f.error}`).join('; '),
        jobs_run: results
      });
    }

    return res.status(200).json({ success: true, jobs_run: results });
  }

  // Direct job execution (for testing)
  const directJobs: Record<string, () => Promise<string>> = {
    'herald-weekly': runHeraldWeekly,
    'herald-monthly': runHeraldMonthly,
    'listener-research': runListenerResearch,
  };

  const directJob = directJobs[jobType];
  if (directJob) {
    try {
      const content = await directJob();
      return res.status(200).json({ success: true, type: jobType, preview: content.slice(0, 200) });
    } catch (error) {
      const reason = generationFailureReason(error);
      console.error(`[Cron] ${jobType} failed: ${reason}`);
      return res.status(502).json({ success: false, type: jobType, error: reason });
    }
  }

  if (jobType === 'metrics-sync' || jobType === 'metrics_sync') {
    try {
      const result = await runMetricsSync();
      return res.status(200).json({ success: true, type: 'metrics-sync', result });
    } catch (error) {
      const reason = generationFailureReason(error);
      console.error(`[Cron] metrics-sync failed: ${reason}`);
      return res.status(502).json({ success: false, type: 'metrics-sync', error: reason });
    }
  }

  return res.status(400).json({ error: 'Unknown cron job type' });
}
