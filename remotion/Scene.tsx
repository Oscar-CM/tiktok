import { AbsoluteFill, Img, OffthreadVideo, interpolate, useCurrentFrame } from "remotion";
import type { MediaAsset } from "../types/job";

export function Scene({
  asset,
  durationInFrames,
}: {
  asset: MediaAsset;
  durationInFrames: number;
}) {
  const frame = useCurrentFrame();

  if (asset.type === "video") {
    return (
      <AbsoluteFill style={{ backgroundColor: "black" }}>
        <OffthreadVideo
          src={asset.url}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          muted
        />
      </AbsoluteFill>
    );
  }

  const scale = interpolate(frame, [0, durationInFrames], [1, 1.12], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "black", overflow: "hidden" }}>
      <Img
        src={asset.url}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale})`,
        }}
      />
    </AbsoluteFill>
  );
}
