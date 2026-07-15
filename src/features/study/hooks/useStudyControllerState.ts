import * as React from "react";
import type { ControllerProps } from "@src/features/study/components/Controller";

export interface UseStudyControllerStateOptions extends ControllerProps {
  enabled?: boolean;
}

export type StudyControllerState = ControllerProps & {
  autoPlay: boolean;
  onToggleAutoPlay: () => void;
};

export const useStudyControllerState = (props: UseStudyControllerStateOptions): StudyControllerState => {
  const cardInterval = props.cardInterval ?? 10;
  const numberOfCards = props.numberOfCards ?? 0;
  const index = props.index ?? 0;
  const autoPlay = props.autoPlay ?? false;
  const enabled = props.enabled ?? true;
  const onChange = props.onChange;

  React.useEffect(() => {
    if (!enabled) return;

    const timeout = setTimeout(() => {
      if (autoPlay && index < numberOfCards) {
        onChange?.(index + 1);
      }
    }, cardInterval * 1000);
    return () => {
      clearTimeout(timeout);
    };
  }, [autoPlay, cardInterval, enabled, index, numberOfCards, onChange]);

  const onToggleAutoPlay = props.onToggleAutoPlay ?? (() => undefined);

  return {
    autoPlay,
    cardInterval,
    index,
    numberOfCards,
    ...(onChange !== undefined ? { onChange } : {}),
    onToggleAutoPlay,
  };
};
