import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { uploadToR2 } from "../storage";
import type { CaptionWord, MediaAsset } from "../../../types/job";

let cachedBundleUrl: string | null = null;

async function getBundleUrl(): Promise<string> {
  if (cachedBundleUrl) return cachedBundleUrl;

  cachedBundleUrl = await bundle({
    entryPoint: path.join(process.cwd(), "..", "remotion", "index.tsx"),
  });

  return cachedBundleUrl;
}

export async function renderVideo(input: {
  scenes: MediaAsset[];
  captionWords: CaptionWord[];
  audioUrl: string;
}): Promise<string> {
  const serveUrl = await getBundleUrl();

  const composition = await selectComposition({
    serveUrl,
    id: "VideoComposition",
    inputProps: input,
  });

  const outputPath = path.join(os.tmpdir(), `render-${Date.now()}.mp4`);

  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: outputPath,
    inputProps: input,
  });

  const buffer = await fs.readFile(outputPath);
  const url = await uploadToR2(buffer, "mp4", "video/mp4");

  await fs.unlink(outputPath).catch(() => {});

  return url;
}
