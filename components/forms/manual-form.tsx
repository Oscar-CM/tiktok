"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const MAX_SCENES = 12;

type SceneInput = {
  id: number;
  file: File | null;
  text: string;
};

let nextId = 1;

function emptyScene(): SceneInput {
  return { id: nextId++, file: null, text: "" };
}

export function ManualForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [scenes, setScenes] = useState<SceneInput[]>([emptyScene()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateScene(id: number, patch: Partial<SceneInput>) {
    setScenes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
  }

  function addScene() {
    if (scenes.length >= MAX_SCENES) return;
    setScenes((prev) => [...prev, emptyScene()]);
  }

  function removeScene(id: number) {
    setScenes((prev) =>
      prev.length > 1 ? prev.filter((s) => s.id !== id) : prev
    );
  }

  const isValid = scenes.every((s) => s.file && s.text.trim());

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!isValid) return;

    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("title", title);
      for (const scene of scenes) {
        formData.append("scenes", scene.file as File);
        formData.append("sceneTexts", scene.text);
      }

      const res = await fetch("/api/jobs", { method: "POST", body: formData });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to create job");
      }

      const data = await res.json();
      router.push(`/jobs/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="title" className="text-sm font-medium text-foreground">
          Title (optional)
        </label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. My morning routine"
          className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm text-foreground outline-none transition focus:border-violet-400/50 placeholder:text-zinc-500"
          disabled={submitting}
        />
      </div>

      <div className="flex flex-col gap-3">
        {scenes.map((scene, i) => (
          <div
            key={scene.id}
            className="glass-card flex flex-col gap-2 p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">
                Scene {i + 1}
              </span>
              {scenes.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeScene(scene.id)}
                  className="text-xs text-zinc-500 hover:text-red-400"
                  disabled={submitting}
                >
                  Remove
                </button>
              )}
            </div>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) =>
                updateScene(scene.id, { file: e.target.files?.[0] ?? null })
              }
              className="text-sm text-zinc-400"
              disabled={submitting}
            />
            <textarea
              value={scene.text}
              onChange={(e) => updateScene(scene.id, { text: e.target.value })}
              placeholder="What should be said over this photo/clip?"
              rows={2}
              className="w-full rounded-lg border border-white/10 bg-white/5 p-2.5 text-sm text-foreground outline-none transition focus:border-violet-400/50 placeholder:text-zinc-500"
              disabled={submitting}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addScene}
        disabled={submitting || scenes.length >= MAX_SCENES}
        className="glass-card self-start px-4 py-2 text-sm font-medium text-foreground disabled:opacity-50"
      >
        + Add scene
      </button>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={submitting || !isValid}
        className="btn-gradient self-start rounded-full px-5 py-2.5 text-sm"
      >
        {submitting ? "Creating..." : "Generate video"}
      </button>
    </form>
  );
}
