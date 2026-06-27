const MIN_SCENE_DURATION_MS = 1500;

/**
 * Splits the actual voiceover duration across scenes proportionally to each
 * scene's word count, so the rendered video always matches the audio length
 * instead of running on a fixed per-scene clip length.
 */
export function distributeDurations(
  texts: string[],
  totalDurationMs: number
): number[] {
  const wordCounts = texts.map((t) => Math.max(1, t.trim().split(/\s+/).length));
  const totalWords = wordCounts.reduce((sum, w) => sum + w, 0);

  const raw = wordCounts.map((w) =>
    Math.max(
      MIN_SCENE_DURATION_MS,
      Math.round((w / totalWords) * totalDurationMs)
    )
  );

  const rawTotal = raw.reduce((sum, d) => sum + d, 0);
  const drift = totalDurationMs - rawTotal;
  raw[raw.length - 1] = Math.max(MIN_SCENE_DURATION_MS, raw[raw.length - 1] + drift);

  return raw;
}
