import * as React from "react";
import { IconContext } from "react-icons";
import { AiOutlinePause, AiOutlineCaretRight } from "react-icons/ai";
import { Slider, Title } from "../Atom";

export const Controller: React.FC<ControllerProps> = (props) => {
  const cardInterval = props.cardInterval ?? 10;
  const numberOfCards = props.numberOfCards ?? 0;
  const index = props.index ?? 0;
  const [autoPlay, setAutoPlay] = React.useState(props.autoPlay ?? false);

  const onChange = props.onChange;
  React.useEffect(() => {
    const f = setTimeout(() => {
      if (autoPlay) {
        if (index < numberOfCards) {
          onChange?.(index + 1);
        }
      }
    }, cardInterval * 1000);
    return () => {
      clearInterval(f);
    };
  }, [autoPlay, cardInterval, index, onChange, numberOfCards]);

  return (
    <IconContext.Provider value={{ className: "dark:text-gray-200 text-2xl" }}>
      <div className="flex px-4 items-center">
        {!autoPlay ? (
          <AiOutlineCaretRight
            data-testid="play"
            onClick={() => {
              setAutoPlay(true);
            }}
            className="text-xl"
          />
        ) : (
          <AiOutlinePause
            data-testid="pause"
            onClick={() => {
              setAutoPlay(false);
            }}
            className="text-xl"
          />
        )}
        <div className="flex-1 px-2">
          <Slider
            min={0}
            max={numberOfCards - 1}
            disabled={index === numberOfCards}
            value={String(index)}
            onChange={(e) => {
              props.onChange?.(parseInt(e.target.value));
            }}
          />
        </div>
        {index < numberOfCards && <Title>{`${index + 1} / ${numberOfCards}`}</Title>}
      </div>
    </IconContext.Provider>
  );
};
