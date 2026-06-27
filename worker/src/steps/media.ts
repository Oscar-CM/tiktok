import { uploadToR2 } from "../storage";
import { distributeDurations } from "../lib/duration";
import type { ScriptBeat } from "./script";
import type { MediaAsset } from "../../../types/job";

if (!process.env.PEXELS_API_KEY) {
  throw new Error("PEXELS_API_KEY is not set");
}

const PEXELS_HEADERS = { Authorization: process.env.PEXELS_API_KEY! };

async function searchPexelsVideo(query: string): Promise<string | null> {
  const res = await fetch(
    `https://api.pexels.com/videos/search?query=${encodeURIComponent(
      query
    )}&orientation=portrait&per_page=1`,
    { headers: PEXELS_HEADERS }
  );
  if (!res.ok) return null;

  const data = await res.json();
  const video = data.videos?.[0];
  if (!video) return null;

  const file =
    video.video_files.find((f: { quality: string }) => f.quality === "hd") ??
    video.video_files[0];
  return file?.link ?? null;
}

async function searchPexelsPhoto(query: string): Promise<string | null> {
  const res = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(
      query
    )}&orientation=portrait&per_page=1`,
    { headers: PEXELS_HEADERS }
  );
  if (!res.ok) return null;

  const data = await res.json();
  const photo = data.photos?.[0];
  return photo?.src?.large2x ?? photo?.src?.original ?? null;
}

async function fetchAndStore(
  sourceUrl: string,
  type: "image" | "video"
): Promise<string> {
  const res = await fetch(sourceUrl);
  const buffer = Buffer.from(await res.arrayBuffer());
  const extension = type === "video" ? "mp4" : "jpg";
  const contentType = type === "video" ? "video/mp4" : "image/jpeg";
  return uploadToR2(buffer, extension, contentType);
}

export async function fetchMediaForBeats(
  beats: ScriptBeat[],
  topic: string,
  totalDurationMs: number
): Promise<MediaAsset[]> {
  const durations = distributeDurations(
    beats.map((b) => b.text),
    totalDurationMs
  );
  const assets: MediaAsset[] = [];

  for (let i = 0; i < beats.length; i++) {
    const beat = beats[i];
    let sourceUrl = await searchPexelsVideo(beat.visualQuery);
    let type: "image" | "video" = "video";

    if (!sourceUrl) {
      sourceUrl = await searchPexelsPhoto(beat.visualQuery);
      type = "image";
    }

    if (!sourceUrl) {
      sourceUrl = await searchPexelsPhoto(topic);
      type = "image";
    }

    if (!sourceUrl) {
      throw new Error(`No media found for beat: ${beat.visualQuery}`);
    }

    const url = await fetchAndStore(sourceUrl, type);
    assets.push({
      url,
      type,
      durationMs: durations[i],
      query: beat.visualQuery,
    });
  }

  return assets;
}
