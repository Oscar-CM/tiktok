export type JobStatus =
  | "pending"
  | "generating_script"
  | "generating_voiceover"
  | "fetching_media"
  | "generating_captions"
  | "rendering"
  | "completed"
  | "failed";

export type CaptionWord = {
  word: string;
  startMs: number;
  endMs: number;
};

export type MediaAsset = {
  url: string;
  type: "image" | "video";
  durationMs: number;
  query?: string;
};

export type JobMode = "ai" | "manual";

export type ManualScene = {
  url: string;
  type: "image" | "video";
  text: string;
};

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  pending: "Queued",
  generating_script: "Writing script",
  generating_voiceover: "Recording voiceover",
  fetching_media: "Finding visuals",
  generating_captions: "Generating captions",
  rendering: "Rendering video",
  completed: "Completed",
  failed: "Failed",
};

export const TERMINAL_STATUSES: JobStatus[] = ["completed", "failed"];
