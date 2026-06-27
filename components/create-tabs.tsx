"use client";

import { useState } from "react";
import { TopicForm } from "@/components/forms/topic-form";
import { ManualForm } from "@/components/forms/manual-form";

export function CreateTabs() {
  const [tab, setTab] = useState<"ai" | "manual">("ai");

  return (
    <div className="glass-card flex flex-col gap-5 p-5">
      <div className="flex gap-1 rounded-full border border-white/10 bg-white/5 p-1">
        <button
          onClick={() => setTab("ai")}
          className={`flex-1 rounded-full px-3 py-1.5 text-sm font-medium transition ${
            tab === "ai"
              ? "btn-gradient"
              : "text-zinc-400 hover:text-foreground"
          }`}
        >
          AI Topic
        </button>
        <button
          onClick={() => setTab("manual")}
          className={`flex-1 rounded-full px-3 py-1.5 text-sm font-medium transition ${
            tab === "manual"
              ? "btn-gradient"
              : "text-zinc-400 hover:text-foreground"
          }`}
        >
          Upload Your Own
        </button>
      </div>

      {tab === "ai" ? <TopicForm /> : <ManualForm />}
    </div>
  );
}
