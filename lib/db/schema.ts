import {
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const jobStatusEnum = pgEnum("job_status", [
  "pending",
  "generating_script",
  "generating_voiceover",
  "fetching_media",
  "generating_captions",
  "rendering",
  "completed",
  "failed",
]);

export const jobModeEnum = pgEnum("job_mode", ["ai", "manual"]);

export const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: text("client_id").notNull(),
  topic: text("topic").notNull(),
  mode: jobModeEnum("mode").notNull().default("ai"),
  status: jobStatusEnum("status").notNull().default("pending"),
  script: text("script"),
  voiceoverUrl: text("voiceover_url"),
  captions: jsonb("captions"),
  mediaAssets: jsonb("media_assets"),
  manualScenes: jsonb("manual_scenes"),
  videoUrl: text("video_url"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
