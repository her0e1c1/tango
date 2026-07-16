import * as React from "react";
import { IconContext } from "react-icons";
import { AiOutlineEdit, AiOutlineDelete } from "react-icons/ai";
import { Card as Surface, Description, Score, Tag, TagList, Title } from "@/shared/components";
import { useSwipeable } from "react-swipeable";

export interface CardActionsProps {
  disabled?: boolean;
  onSwipedLeft?: (id: string) => void;
  onSwipedRight?: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
  goToEdit?: (id: string) => void;
  goToView?: (id: string) => void;
}

export type CardProps = CardActionsProps;

export const Card: React.FC<
  {
    className?: string;
    card: Card;
    filtered?: boolean;
  } & CardActionsProps
> = (props) => {
  const id = props.card.id;
  const goToView = React.useCallback(() => {
    if (!props.disabled) props.goToView?.(id);
  }, [id, props]);
  const goToEdit = React.useCallback(() => {
    if (!props.disabled) props.goToEdit?.(id);
  }, [id, props]);
  const onDelete = React.useCallback(() => {
    if (!props.disabled) props.onDelete?.(id);
  }, [id, props]);
  const onSwipedLeft = React.useCallback(() => {
    if (!props.disabled) props.onSwipedLeft?.(id);
  }, [id, props]);
  const onSwipedRight = React.useCallback(() => {
    if (!props.disabled) props.onSwipedRight?.(id);
  }, [id, props]);
  const handlers = useSwipeable({
    onSwipedLeft,
    onSwipedRight,
    trackMouse: true,
  });
  return (
    <div className={props.className} {...handlers}>
      <IconContext.Provider value={{ className: "text-2xl" }}>
        <Surface full border className="gap-3 p-4" disabled={Boolean(props.filtered || props.disabled)}>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Score className="mr-1 shrink-0" score={props.card.score} />
            <Description>studied {props.card.numberOfSeen ?? 0} time(s)</Description>
            <TagList>
              {props.card.tags.map((tag) => (
                <Tag key={tag} small primary label={tag} />
              ))}
            </TagList>
          </div>
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end">
            <Title className="max-w-reading flex-1 break-words" onClick={goToView}>
              {props.card.frontText}
            </Title>
            <div className="flex shrink-0 gap-2 self-end">
              <AiOutlineEdit className="text-ink" size={24} onClick={goToEdit} />
              <AiOutlineDelete className="text-danger" size={24} onClick={onDelete} />
            </div>
          </div>
        </Surface>
      </IconContext.Provider>
    </div>
  );
};
