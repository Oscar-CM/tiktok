"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function TopicForm() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!topic.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });

      if (!res.ok) {
        throw new Error("Failed to create job");
      }

      const data = await res.json();
      router.push(`/jobs/${data.id}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
      <label htmlFor="topic" className="text-sm font-medium text-foreground">
        Video topic
      </label>
      <textarea
        id="topic"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="e.g. 5 surprising facts about deep sea creatures"
        rows={3}
        className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-foreground outline-none transition focus:border-violet-400/50 placeholder:text-zinc-500"
        disabled={submitting}
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={submitting || !topic.trim()}
        className="btn-gradient self-start rounded-full px-5 py-2.5 text-sm"
      >
        {submitting ? "Creating..." : "Generate video"}
      </button>
    </form>
  );
}
