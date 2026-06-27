import { CreateTabs } from "@/components/create-tabs";
import { JobList } from "@/components/job-list";

export default function DashboardPage() {
  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Create a video
        </h1>
        <p className="text-sm text-zinc-400">
          Enter a topic or upload your own scenes to get a finished 1080x1920
          vertical video with voiceover, visuals, and captions.
        </p>
      </div>
      <CreateTabs />
      <JobList />
    </>
  );
}
