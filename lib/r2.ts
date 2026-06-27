import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import type { MediaAsset, ManualScene } from "@/types/job";
import type { Job } from "@/lib/db/schema";

function getClient() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

export async function uploadToR2(
  buffer: Buffer,
  extension: string,
  contentType: string
): Promise<string> {
  const key = `${randomUUID()}.${extension}`;

  await getClient().send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return `${process.env.R2_PUBLIC_URL}/${key}`;
}

function keyFromUrl(url: string): string | null {
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!publicUrl || !url.startsWith(publicUrl)) return null;
  return url.slice(publicUrl.length + 1);
}

export async function deleteJobFiles(job: Job) {
  const urls: string[] = [];
  if (job.videoUrl) urls.push(job.videoUrl);
  if (job.voiceoverUrl) urls.push(job.voiceoverUrl);
  for (const asset of (job.mediaAssets as MediaAsset[] | null) ?? []) {
    urls.push(asset.url);
  }
  for (const scene of (job.manualScenes as ManualScene[] | null) ?? []) {
    urls.push(scene.url);
  }

  const keys = urls.map(keyFromUrl).filter((k): k is string => !!k);
  if (keys.length === 0) return;

  const s3 = getClient();
  await Promise.all(
    keys.map((key) =>
      s3
        .send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET!, Key: key }))
        .catch((err) => console.error(`Failed to delete R2 key ${key}:`, err))
    )
  );
}
