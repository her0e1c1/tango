import * as React from "react";
import type { StudyCompletion } from "./types";

export const useStudyState = (defaultAutoPlay: boolean) => {
  const [completion, setCompletion] = React.useState<StudyCompletion>();
  const [showBackText, setShowBackText] = React.useState(false);
  const [helpOpen, setHelpOpen] = React.useState(false);
  const [autoPlay, setAutoPlay] = React.useState(defaultAutoPlay);
  // All four directions share the lock so a pending save cannot overlap another gesture.
  const swipePendingRef = React.useRef(false);
  return {
    completion,
    setCompletion,
    showBackText,
    setShowBackText,
    helpOpen,
    setHelpOpen,
    autoPlay,
    setAutoPlay,
    swipePendingRef,
  };
};
