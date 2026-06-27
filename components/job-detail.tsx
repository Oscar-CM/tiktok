"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { JOB_STATUS_LABELS, TERMINAL_STATUSES, type JobStatus } from "@/types/job";
import type { Job } from "@/lib/db/schema";

const STAGES = [
  "pending",
  "generating_script",
  "generating_voiceover",
  "fetching_media",
  "generating_captions",
  "rendering",
  "completed",
] as const;

const STAGE_TIPS: Record<JobStatus, string> = {
  pending: "Lining up your job in the queue...",
  generating_script: "Claude is writing a script sized for a 30-60s video.",
  generating_voiceover: "Recording a natural-sounding voiceover.",
  fetching_media: "Searching stock footage and photos for each beat.",
  generating_captions: "Transcribing the voiceover for word-by-word captions.",
  rendering: "Assembling visuals, captions, and audio into the final MP4. This is usually the slowest step.",
  completed: "Done!",
  failed: "Something went wrong.",
};

function Spinner() {
  return (
    <span
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-violet-400"
      aria-hidden
    />
  );
}

function formatElapsed(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function JobDetail({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this video? This can't be undone.")) return;

    setDeleting(true);
    const res = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/dashboard");
    } else {
      setDeleting(false);
      alert("Failed to delete. Please try again.");
    }
  }

  useEffect(() => {
    let active = true;

    async function poll() {
      const res = await fetch(`/api/jobs/${jobId}`);
      if (!active) return;

      if (!res.ok) {
        setNotFound(true);
        return;
      }

      const data = await res.json();
      setJob(data.job);

      if (!TERMINAL_STATUSES.includes(data.job.status)) {
        setTimeout(poll, 2500);
      }
    }

    poll();
    return () => {
      active = false;
    };
  }, [jobId]);

  useEffect(() => {
    if (!job || TERMINAL_STATUSES.includes(job.status)) return;

    const startedAt = new Date(job.createdAt).getTime();
    const tick = () => setElapsedMs(Date.now() - startedAt);
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [job]);

  if (notFound) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-zinc-400">Job not found.</p>
        <Link href="/dashboard" className="text-sm font-medium text-violet-300 hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <Spinner />
        Loading...
      </div>
    );
  }

  const stageIndex = STAGES.indexOf(
    job.status === "failed" ? "pending" : job.status
  );
  const progressPercent = Math.round(
    (Math.max(stageIndex, 0) / (STAGES.length - 1)) * 100
  );
  const isProcessing = !TERMINAL_STATUSES.includes(job.status);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-foreground">
            ← Back
          </Link>
          <h1 className="text-xl font-semibold text-foreground">{job.topic}</h1>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="shrink-0 rounded-full border border-red-400/30 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50"
        >
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>

      {job.status === "failed" ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-red-400">
            Failed: {job.errorMessage ?? "Unknown error"}
          </p>
          <Link
            href="/dashboard"
            className="btn-gradient self-start rounded-full px-4 py-2 text-sm"
          >
            Try another topic
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {isProcessing && (
            <div className="glass-card flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="flex items-center gap-2 font-medium text-foreground">
                  <Spinner />
                  {JOB_STATUS_LABELS[job.status]}
                </span>
                <span>{formatElapsed(elapsedMs)} elapsed</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-linear-to-r from-violet-500 to-cyan-400 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-xs text-zinc-400">{STAGE_TIPS[job.status]}</p>
              <p className="text-xs text-zinc-500">
                Typically takes 2-4 minutes total. Feel free to leave this
                page open — it&apos;ll keep updating.
              </p>
            </div>
          )}

          <ol className="flex flex-col gap-2 text-sm">
            {STAGES.slice(1).map((stage, i) => {
              const isDone = stageIndex > i + 1 || job.status === "completed";
              const isCurrent = job.status === stage;
              return (
                <li
                  key={stage}
                  className={
                    "flex items-center gap-2 " +
                    (isDone
                      ? "text-zinc-500 line-through"
                      : isCurrent
                        ? "font-medium text-foreground"
                        : "text-zinc-500")
                  }
                >
                  {isCurrent && <Spinner />}
                  {isDone && <span className="text-violet-400">✓</span>}
                  {JOB_STATUS_LABELS[stage]}
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {job.status === "completed" && job.videoUrl && (
        <div className="flex flex-col gap-4">
          <video
            src={job.videoUrl}
            controls
            className="aspect-[9/16] w-full max-w-xs rounded-xl border border-white/10"
          />
          <a
            href={job.videoUrl}
            download
            className="btn-gradient self-start rounded-full px-4 py-2 text-sm"
          >
            Download MP4
          </a>
        </div>
      )}
    </div>
  );
}
