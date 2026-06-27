import { Fragment } from "react";
import { AbsoluteFill, Audio, useCurrentFrame, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Scene } from "./Scene";
import type { CaptionWord, MediaAsset } from "../types/job";

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const TRANSITION_FRAMES = Math.round(FPS * 0.4);

export type VideoCompositionProps = {
  scenes: MediaAsset[];
  captionWords: CaptionWord[];
  audioUrl: string;
};

function Captions({ words }: { words: CaptionWord[] }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentMs = (frame / fps) * 1000;

  const active = words.filter(
    (w) => currentMs >= w.startMs - 50 && currentMs <= w.endMs + 200
  );

  if (active.length === 0) return null;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: 220,
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 10,
          maxWidth: "85%",
        }}
      >
        {active.map((w, i) => {
          const isCurrent = currentMs >= w.startMs && currentMs <= w.endMs;
          return (
            <span
              key={`${w.word}-${i}`}
              style={{
                fontFamily: "Arial, Helvetica, sans-serif",
                fontWeight: 800,
                fontSize: 64,
                color: isCurrent ? "#ffe14d" : "#ffffff",
                textShadow: "0 4px 12px rgba(0,0,0,0.85)",
              }}
            >
              {w.word}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

export function VideoComposition({
  scenes,
  captionWords,
  audioUrl,
}: VideoCompositionProps) {
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <Audio src={audioUrl} />
      <TransitionSeries>
        {scenes.map((scene, i) => {
          // Pad every scene but the last by the transition length so the
          // crossfade overlap doesn't eat into the total duration — this
          // keeps the video's total length matched to the voiceover.
          const isLast = i === scenes.length - 1;
          const baseFrames = Math.round((scene.durationMs / 1000) * FPS);
          const durationInFrames = isLast
            ? baseFrames
            : baseFrames + TRANSITION_FRAMES;

          return (
            <Fragment key={i}>
              <TransitionSeries.Sequence durationInFrames={durationInFrames}>
                <Scene asset={scene} durationInFrames={durationInFrames} />
              </TransitionSeries.Sequence>
              {!isLast && (
                <TransitionSeries.Transition
                  presentation={fade()}
                  timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
                />
              )}
            </Fragment>
          );
        })}
      </TransitionSeries>
      <Captions words={captionWords} />
    </AbsoluteFill>
  );
}

export function getTotalDurationInFrames(scenes: MediaAsset[]): number {
  const totalMs = scenes.reduce((sum, s) => sum + s.durationMs, 0);
  return Math.max(1, Math.round((totalMs / 1000) * FPS));
}
