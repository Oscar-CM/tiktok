import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

const FEATURES = [
  {
    title: "AI script & voiceover",
    description:
      "Give it a topic — Claude writes the script, a natural voice reads it aloud.",
  },
  {
    title: "Auto visuals & captions",
    description:
      "Stock footage matched to every beat, animated, with word-by-word captions.",
  },
  {
    title: "Or upload your own",
    description:
      "Bring your own photos and lines per scene — we handle the rest.",
  },
];

export default async function Home() {
  const { userId } = await auth();

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24 sm:py-32">
      <main className="flex w-full max-w-2xl flex-col items-center gap-10 text-center">
        <div className="flex flex-col gap-5">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Turn any idea into a
            <br />
            <span className="gradient-text">ready-to-post video</span>
          </h1>
          <p className="text-base text-zinc-400 sm:text-lg">
            Faceless Content Factory generates finished 1080x1920 vertical
            videos for TikTok, Reels, and Shorts — script, voiceover, visuals,
            and captions, all automatic.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {userId ? (
            <Link
              href="/dashboard"
              className="btn-gradient rounded-full px-6 py-3 text-sm"
            >
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/sign-up"
                className="btn-gradient rounded-full px-6 py-3 text-sm"
              >
                Get started free
              </Link>
              <Link
                href="/sign-in"
                className="glass-card rounded-full px-6 py-3 text-sm font-medium text-foreground"
              >
                Sign in
              </Link>
            </>
          )}
        </div>

        <div className="grid w-full gap-4 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="glass-card flex flex-col gap-2 p-5 text-left"
            >
              <h2 className="text-sm font-semibold text-foreground">
                {feature.title}
              </h2>
              <p className="text-sm text-zinc-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
