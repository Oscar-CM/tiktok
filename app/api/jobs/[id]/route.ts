import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { jobs } from "@/lib/db/schema";
import { deleteJobFiles } from "@/lib/r2";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [job] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);

  if (!job || job.clientId !== userId) {
    return Response.json({ error: "Job not found" }, { status: 404 });
  }

  return Response.json({ job });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [job] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);

  if (!job || job.clientId !== userId) {
    return Response.json({ error: "Job not found" }, { status: 404 });
  }

  await deleteJobFiles(job);
  await db.delete(jobs).where(eq(jobs.id, id));

  return Response.json({ ok: true });
}
