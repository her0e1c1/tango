import React from "react";

import { usePreferences } from "@/entities/preferences";

export const useStudyDisplayState = () => {
  const preferences = usePreferences();
  const [showBackText, setShowBackText] = React.useState(false);
  const [autoPlay, setAutoPlay] = React.useState(preferences.study.defaultAutoPlay);

  return {
    autoPlay,
    showBackText,
    preferences,
    hideBackText: React.useCallback(() => setShowBackText(false), []),
    toggleBackText: React.useCallback(() => setShowBackText((visible) => !visible), []),
    restoreBackText: React.useCallback((visible: boolean) => setShowBackText(visible), []),
    toggleAutoPlay: React.useCallback(() => setAutoPlay((playing) => !playing), []),
  };
};
