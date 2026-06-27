"use client";

import { useEffect, useState } from "react";
import { JobStatusCard } from "@/components/cards/job-status-card";
import type { Job } from "@/lib/db/schema";

export function JobList() {
  const [jobs, setJobs] = useState<Job[] | null>(null);

  useEffect(() => {
    fetch("/api/jobs")
      .then((res) => res.json())
      .then((data) => setJobs(data.jobs ?? []))
      .catch(() => setJobs([]));
  }, []);

  if (!jobs || jobs.length === 0) return null;

  function handleDeleted(id: string) {
    setJobs((prev) => prev?.filter((j) => j.id !== id) ?? null);
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <h2 className="text-sm font-medium text-zinc-400">Your videos</h2>
      <div className="flex flex-col gap-2">
        {jobs.map((job) => (
          <JobStatusCard key={job.id} job={job} onDeleted={handleDeleted} />
        ))}
      </div>
    </div>
  );
}
