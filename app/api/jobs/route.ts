import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { jobs } from "@/lib/db/schema";
import { uploadToR2 } from "@/lib/r2";
import type { ManualScene } from "@/types/job";

const MAX_SCENES = 12;
const MAX_FILE_BYTES = 20 * 1024 * 1024;

async function handleAiMode(request: NextRequest, clientId: string) {
  const body = await request.json();
  const topic = typeof body.topic === "string" ? body.topic.trim() : "";

  if (!topic) {
    return Response.json({ error: "topic is required" }, { status: 400 });
  }

  const [job] = await db
    .insert(jobs)
    .values({ topic, clientId, mode: "ai" })
    .returning({ id: jobs.id });

  return Response.json({ id: job.id }, { status: 201 });
}

async function handleManualMode(request: NextRequest, clientId: string) {
  const formData = await request.formData();
  const title = formData.get("title");
  const files = formData.getAll("scenes");
  const texts = formData.getAll("sceneTexts");

  if (files.length === 0 || files.length !== texts.length) {
    return Response.json(
      { error: "Each scene needs both an image/video and text" },
      { status: 400 }
    );
  }

  if (files.length > MAX_SCENES) {
    return Response.json(
      { error: `A maximum of ${MAX_SCENES} scenes is supported` },
      { status: 400 }
    );
  }

  const scenes: ManualScene[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const text = texts[i];

    if (!(file instanceof File) || typeof text !== "string" || !text.trim()) {
      return Response.json(
        { error: `Scene ${i + 1} is missing a file or text` },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_BYTES) {
      return Response.json(
        { error: `Scene ${i + 1}'s file exceeds the 20MB limit` },
        { status: 400 }
      );
    }

    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    if (!isVideo && !isImage) {
      return Response.json(
        { error: `Scene ${i + 1} must be an image or video file` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const extension = isVideo ? "mp4" : "jpg";
    const url = await uploadToR2(buffer, extension, file.type);

    scenes.push({ url, type: isVideo ? "video" : "image", text: text.trim() });
  }

  const topic =
    typeof title === "string" && title.trim()
      ? title.trim()
      : scenes[0].text.slice(0, 60);

  const [job] = await db
    .insert(jobs)
    .values({ topic, clientId, mode: "manual", manualScenes: scenes })
    .returning({ id: jobs.id });

  return Response.json({ id: job.id }, { status: 201 });
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    return handleManualMode(request, userId);
  }

  return handleAiMode(request, userId);
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(jobs)
    .where(eq(jobs.clientId, userId))
    .orderBy(desc(jobs.createdAt))
    .limit(20);

  return Response.json({ jobs: rows });
}
