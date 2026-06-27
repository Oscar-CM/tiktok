import { registerRoot, Composition } from "remotion";
import {
  FPS,
  HEIGHT,
  WIDTH,
  VideoComposition,
  getTotalDurationInFrames,
  type VideoCompositionProps,
} from "./Composition";

const defaultProps: VideoCompositionProps = {
  scenes: [],
  captionWords: [],
  audioUrl: "",
};

function Root() {
  return (
    <Composition
      id="VideoComposition"
      component={VideoComposition}
      durationInFrames={getTotalDurationInFrames(defaultProps.scenes) || FPS}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={defaultProps}
      calculateMetadata={async ({ props }) => ({
        durationInFrames: getTotalDurationInFrames(props.scenes),
      })}
    />
  );
}

registerRoot(Root);
