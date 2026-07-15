import type * as React from "react";
import { IconContext } from "react-icons";
import { AiOutlinePause, AiOutlineCaretRight } from "react-icons/ai";
import { Slider, Title } from "@/shared/components";

export interface ControllerProps {
  autoPlay?: boolean;
  index?: number;
  cardInterval?: number;
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
      <div className="flex px-4 items-center">
        {!autoPlay ? (
          <AiOutlineCaretRight data-testid="play" onClick={props.onToggleAutoPlay} className="text-xl" />
        ) : (
          <AiOutlinePause data-testid="pause" onClick={props.onToggleAutoPlay} className="text-xl" />
        )}
        <div className="flex-1 px-2">
          <Slider
            min={0}
            max={numberOfCards - 1}
            disabled={index === numberOfCards}
            value={String(index)}
            onChange={(e) => {
              props.onChange?.(parseInt(e.target.value, 10));
            }}
          />
        </div>
        {index < numberOfCards && <Title>{`${index + 1} / ${numberOfCards}`}</Title>}
      </div>
    </IconContext.Provider>
  );
};
