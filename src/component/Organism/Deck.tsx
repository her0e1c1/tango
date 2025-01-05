import * as React from "react";
import { Button, Description, Title, Tag } from "../Atom";
import { IconContext } from "react-icons";
import {
  AiOutlineCloud,
  AiOutlineCloudDownload,
  AiOutlineEdit,
  AiOutlineDelete,
  AiOutlineReload,
} from "react-icons/ai";
import { Card } from "../Molecule";

export const DeckCard: React.FC<DeckCardProps> = (props) => {
  const deck = props.deck;
  if (deck == null) throw Error("invalid deck");
  const id = deck.id;
  const onClickName = React.useCallback(() => {
    props.onClickName?.(id);
  }, [id, props]);
  const onClickStudy = React.useCallback(() => {
    props.onClickStudy?.(id);
  }, [id, props]);
  const onClickRestart = React.useCallback(() => {
    props.onClickRestart?.(id);
  }, [id, props]);
  const onClickDownload = React.useCallback(() => {
    props.onClickDownload?.(id);
  }, [id, props]);
  const onClickEdit = React.useCallback(() => {
    props.onClickEdit?.(id);
  }, [id, props]);
  const onClickDelete = React.useCallback(() => {
    props.onClickDelete?.(id);
  }, [id, props]);
  const onClickReimport = React.useCallback(() => {
    props.onClickReimport?.(id);
  }, [id, props]);
  return (
    <IconContext.Provider value={{ className: "dark:text-gray-200 text-2xl" }}>
      <Card full className="px-4 pt-4 pb-2">
        <div className="">
          <div className="flex">
            <Title onClick={onClickName}>{deck.name}</Title>
            <Tag className="mr-2 mb-2" round label={deck.category} hidden={!deck.category} />
            {deck.isPublic && <AiOutlineCloud className="self-baseline mt-1" size={24} />}
          </div>
          {deck.cardOrderIds.length > 0 && (
            <Description>
              studying {(deck.currentIndex ?? -1) + 1} card(s) from {deck.cardOrderIds?.length}
            </Description>
          )}
        </div>

        <div>
          <div className="mt-2 flex justify-between">
            <Button primary className="mr-5" onClick={onClickStudy}>
              Study
            </Button>
            <Button default disabled={deck.currentIndex == null} onClick={onClickRestart}>
              Restart
            </Button>
          </div>

          <div className="flex justify-center border-t mt-4 pt-2 border-gray-300 dark:border-gray-900">
            <AiOutlineCloudDownload className="mr-4" onClick={onClickDownload} />
            <AiOutlineEdit className="mr-4" onClick={onClickEdit} />
            <AiOutlineDelete className="mr-4" onClick={onClickDelete} />
            {deck.url != null && <AiOutlineReload className="mr-4" onClick={onClickReimport} />}
          </div>
        </div>
      </Card>
    </IconContext.Provider>
  );
};
