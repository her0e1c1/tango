import * as React from "react";
import { IconContext } from "react-icons";
import { AiOutlineEdit, AiOutlineDelete } from "react-icons/ai";
import { Score, Tag, Title, Description } from "../Atom";
import { Card as Outline } from "../Molecule";
import { useSwipeable } from "react-swipeable";

export const Card: React.FC<
  {
    className?: string;
    card: Card;
    filtered?: boolean;
  } & CardActionsProps
> = (props) => {
  const id = props.card.id;
  const goToView = React.useCallback(() => {
    props.goToView?.(id);
  }, [id, props]);
  const goToEdit = React.useCallback(() => {
    props.goToEdit?.(id);
  }, [id, props]);
  const onDelete = React.useCallback(() => {
    props.onDelete?.(id);
  }, [id, props]);
  const onSwipedLeft = React.useCallback(() => {
    props.onSwipedLeft?.(id);
  }, [id, props]);
  const onSwipedRight = React.useCallback(() => {
    props.onSwipedRight?.(id);
  }, [id, props]);
  const handlers = useSwipeable({
    onSwipedLeft,
    onSwipedRight,
    trackMouse: true,
  });
  return (
    <div {...handlers}>
      <IconContext.Provider value={{ className: "dark:text-gray-200 text-2xl" }}>
        <Outline full border disabled={props.filtered} className="px-4 py-2">
          <div className="flex items-center whitespace-nowrap gap-1">
            <Score className="mr-1" score={props.card.score} />
            <Description>studied {props.card.numberOfSeen ?? 0} time(s)</Description>
            <div className="flex ml-auto gap-2">
              {props.card.tags.map((tag) => (
                <Tag key={tag} small primary label={tag} />
              ))}
            </div>
          </div>
          <div className="flex">
            <Title className="flex-1" onClick={goToView}>
              {props.card.frontText}
            </Title>
            <div className="flex gap-2 items-end">
              <AiOutlineEdit size={24} onClick={goToEdit} />
              <AiOutlineDelete size={24} onClick={onDelete} />
            </div>
          </div>
        </Outline>
      </IconContext.Provider>
    </div>
  );
};
