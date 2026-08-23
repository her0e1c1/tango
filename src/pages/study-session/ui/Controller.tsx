import cx from "classnames";
import type * as React from "react";
import { AiOutlinePause, AiOutlineCaretRight } from "react-icons/ai";
import { Slider } from "@/shared/ui/forms";

export interface ControllerProps {
  autoPlay?: boolean;
  index?: number;
  numberOfCards?: number;
  onToggleAutoPlay?: () => void;
  onChange?: (index: number) => void;
}

export const Controller: React.FC<ControllerProps> = (props) => {
  const numberOfCards = props.numberOfCards ?? 0;
  const index = props.index ?? 0;
  const autoPlay = props.autoPlay ?? false;

  return (
    <div className="mx-auto flex w-full max-w-content items-center gap-2">
      <button
        type="button"
        aria-label={autoPlay ? "Pause" : "Play"}
        aria-pressed={autoPlay}
        className={cx(
          "inline-flex size-touch shrink-0 items-center justify-center rounded-control text-ink-muted transition-colors duration-fast ease-calm hover:bg-surface-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
          autoPlay && "bg-surface-muted text-ink"
        )}
        onClick={props.onToggleAutoPlay}
      >
        {autoPlay ? (
          <AiOutlinePause aria-hidden="true" className="text-xl" />
        ) : (
          <AiOutlineCaretRight aria-hidden="true" className="text-xl" />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <Slider
          min={0}
          max={Math.max(numberOfCards - 1, 0)}
          disabled={numberOfCards === 0 || index >= numberOfCards}
          value={String(index)}
          aria-label="Study progress"
          aria-valuetext={`${String(Math.min(index + 1, numberOfCards))} of ${String(numberOfCards)}`}
          onChange={(e) => {
            props.onChange?.(Number.parseInt(e.target.value, 10));
          }}
        />
      </div>
      {index < numberOfCards ? (
        <span className="min-w-16 text-right text-caption font-bold tabular-nums text-ink-muted">
          {`${String(index + 1)} / ${String(numberOfCards)}`}
        </span>
      ) : null}
    </div>
  );
};
