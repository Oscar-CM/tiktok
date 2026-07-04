import { eq } from "drizzle-orm";
import { db, jobs, type Job } from "./db";
import { generateScript } from "./steps/script";
import { generateVoiceover } from "./steps/voiceover";
import { fetchMediaForBeats } from "./steps/media";
import { generateCaptions } from "./steps/captions";
import { renderVideo } from "./steps/render";
import { distributeDurations } from "./lib/duration";
import type { MediaAsset, ManualScene } from "../../types/job";

async function update(id: string, values: Partial<Job>) {
  await db
    .update(jobs)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(jobs.id, id));
}

async function runAiPipeline(job: Job) {
  const scriptResult = await generateScript(job.topic);
  await update(job.id, { script: scriptResult.fullScript });

  await update(job.id, { status: "generating_voiceover" });
  const voiceover = await generateVoiceover(scriptResult.fullScript);
  await update(job.id, { voiceoverUrl: voiceover.url });

  await update(job.id, { status: "fetching_media" });
  const mediaAssets = await fetchMediaForBeats(
    scriptResult.beats,
    job.topic,
    voiceover.durationMs
  );
  await update(job.id, { mediaAssets });

  await update(job.id, { status: "generating_captions" });
  const captions = await generateCaptions(voiceover.url);
  await update(job.id, { captions });

  await update(job.id, { status: "rendering" });
  const videoUrl = await renderVideo({
    scenes: mediaAssets,
    captionWords: captions,
    audioUrl: voiceover.url,
  });

  await update(job.id, { status: "completed", videoUrl });
}

async function runManualPipeline(job: Job) {
  const scenes = job.manualScenes as ManualScene[];
  const fullScript = scenes.map((s) => s.text).join(" ");

  await update(job.id, { status: "generating_voiceover", script: fullScript });
  const voiceover = await generateVoiceover(fullScript);
  await update(job.id, { voiceoverUrl: voiceover.url });

  const durations = distributeDurations(
    scenes.map((s) => s.text),
    voiceover.durationMs
  );
  const mediaAssets: MediaAsset[] = scenes.map((scene, i) => ({
    url: scene.url,
    type: scene.type,
    durationMs: durations[i],
  }));
  await update(job.id, { mediaAssets });

  await update(job.id, { status: "generating_captions" });
  const captions = await generateCaptions(voiceover.url);
  await update(job.id, { captions });

  await update(job.id, { status: "rendering" });
  const videoUrl = await renderVideo({
    scenes: mediaAssets,
    captionWords: captions,
    audioUrl: voiceover.url,
  });

  await update(job.id, { status: "completed", videoUrl });
}

export async function runPipeline(job: Job) {
  try {
    if (job.mode === "manual") {
      await runManualPipeline(job);
    } else {
      await runAiPipeline(job);
    }
  } catch (error) {
    console.error(`Job ${job.id} failed:`, error);
    await update(job.id, {
      status: "failed",
      errorMessage: error instanceof Error ? error.message : String(error),
    });
  }
}
