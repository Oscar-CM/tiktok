import { asc, eq } from "drizzle-orm";
import { db, jobs } from "./db";
import { runPipeline } from "./pipeline";

const POLL_INTERVAL_MS = 5000;

async function claimNextJob() {
  const [job] = await db
    .select()
    .from(jobs)
    .where(eq(jobs.status, "pending"))
    .orderBy(asc(jobs.createdAt))
    .limit(1);

  return job ?? null;
}

async function tick() {
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
