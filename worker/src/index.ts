import { asc, eq, sql } from "drizzle-orm";
import { db, jobs } from "./db";
import { runPipeline } from "./pipeline";

const POLL_INTERVAL_MS = 5000;
// Jobs stuck in an in-progress state for longer than this are treated as
// crashed and reset to pending so they can be retried.
const STALE_JOB_TIMEOUT_MS = 10 * 60 * 1000;

async function resetStaleJobs() {
  const cutoff = new Date(Date.now() - STALE_JOB_TIMEOUT_MS);
  await db.execute(
    sql`UPDATE jobs
        SET status = 'pending', updated_at = NOW()
        WHERE status IN ('generating_script','generating_voiceover','fetching_media','generating_captions','rendering')
        AND updated_at < ${cutoff}`
  );
}

async function claimNextJob() {
  // Single atomic UPDATE ... WHERE status='pending' RETURNING * prevents two
  // workers from picking up the same job and avoids stuck jobs from a
  // select-then-update race.
  const [job] = await db
    .update(jobs)
    .set({ status: "generating_script", updatedAt: new Date() })
    .where(
      eq(
        jobs.id,
        sql`(
          SELECT id FROM ${jobs}
          WHERE status = 'pending'
          ORDER BY created_at ASC
          LIMIT 1
          FOR UPDATE SKIP LOCKED
        )`
      )
    )
    .returning();

  return job ?? null;
}

async function tick() {
  await resetStaleJobs();
  const job = await claimNextJob();
  if (!job) return;

  console.log(`Picked up job ${job.id} (${job.topic})`);
  await runPipeline(job);
}

async function main() {
  console.log("Worker started, polling for jobs...");

  while (true) {
    try {
      await tick();
    } catch (error) {
      console.error("Poll loop error:", error);
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

main();
