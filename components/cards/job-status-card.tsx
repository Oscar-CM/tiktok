"use client";

import Link from "next/link";
import { JOB_STATUS_LABELS } from "@/types/job";
import type { Job } from "@/lib/db/schema";

export function JobStatusCard({
  job,
  onDeleted,
}: {
  job: Job;
  onDeleted: (id: string) => void;
}) {
  async function handleDelete(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!confirm("Delete this video? This can't be undone.")) return;

    const res = await fetch(`/api/jobs/${job.id}`, { method: "DELETE" });
    if (res.ok) onDeleted(job.id);
    else alert("Failed to delete. Please try again.");
  }

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="glass-card flex items-center justify-between gap-3 p-4 text-sm transition hover:border-violet-400/30"
    >
      <div className="flex flex-col gap-1">
        <span className="font-medium text-foreground">{job.topic}</span>
        <span className="text-zinc-400">{JOB_STATUS_LABELS[job.status]}</span>
      </div>
      <button
        onClick={handleDelete}
        className="shrink-0 rounded-full px-2 py-1 text-xs text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
        aria-label="Delete video"
      >
        Delete
      </button>
    </Link>
  );
}
