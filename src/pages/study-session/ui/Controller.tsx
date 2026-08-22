import type * as React from "react";
import { IconContext } from "react-icons";
import { AiOutlinePause, AiOutlineCaretRight } from "react-icons/ai";
import { Title } from "@/shared/ui/content";
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
    <IconContext.Provider value={{ className: "dark:text-gray-200 text-2xl" }}>
      <div className="flex items-center px-4">
        <button
          type="button"
          aria-label={autoPlay ? "Pause" : "Play"}
          className="inline-flex size-touch shrink-0 items-center justify-center rounded-control text-ink-muted transition-colors duration-fast ease-calm hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          onClick={props.onToggleAutoPlay}
        >
          {autoPlay ? (
            <AiOutlinePause aria-hidden="true" className="text-xl" />
          ) : (
            <AiOutlineCaretRight aria-hidden="true" className="text-xl" />
          )}
        </button>
        <div className="flex-1 px-2">
          <Slider
            min={0}
            max={numberOfCards - 1}
            disabled={index === numberOfCards}
            value={String(index)}
            onChange={(e) => {
              props.onChange?.(Number.parseInt(e.target.value, 10));
            }}
          />
        </div>
        {index < numberOfCards && <Title>{`${String(index + 1)} / ${String(numberOfCards)}`}</Title>}
      </div>
    </IconContext.Provider>
  );
};
