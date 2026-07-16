import * as React from "react";
import { Button, Card, Description, Tag, Title } from "@/shared/components";
import { IconContext } from "react-icons";
import {
  AiOutlineCloud,
  AiOutlineCloudDownload,
  AiOutlineEdit,
  AiOutlineDelete,
  AiOutlineReload,
} from "react-icons/ai";

export interface DeckCardActions {
  onClickName?: (id: string) => void;
  onClickStudy?: (id: string) => void;
  onClickRestart?: (id: string) => void;
  onClickDownload?: (id: string) => void;
  onClickEdit?: (id: string) => void;
  onClickDelete?: (id: string) => void;
  onClickReimport?: (id: string) => void;
}

export interface StudyProgress {
  currentIndex: number;
  cardCount: number;
}

export interface DeckCardProps extends DeckCardActions {
  deck?: Deck;
  studyProgress?: StudyProgress;
}

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
    <IconContext.Provider value={{ className: "text-2xl" }}>
      <Card full className="px-4 pb-3 pt-4">
        <div>
          <div className="flex min-w-0 flex-wrap items-start gap-1">
            <Title onClick={onClickName}>{deck.name}</Title>
            <Tag className="mr-2 mb-2" round label={deck.category} hidden={!deck.category} />
            {deck.isPublic && <AiOutlineCloud className="mt-1 shrink-0 text-ink-muted" size={24} />}
          </div>
          {props.studyProgress != null && (
            <Description>
              studying {props.studyProgress.currentIndex + 1} card(s) from {props.studyProgress.cardCount}
            </Description>
          )}
        </div>

        <div className="mt-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              className="flex-1"
              onClick={props.studyProgress == null ? onClickStudy : onClickRestart}
            >
              {props.studyProgress == null ? "Study" : "Continue"}
            </Button>
            <Button variant="quiet" className="flex-1" disabled={props.studyProgress == null} onClick={onClickStudy}>
              Restart
            </Button>
          </div>

          <div className="mt-4 flex justify-center gap-1 border-t border-border pt-2">
            <AiOutlineCloudDownload
              className="size-touch rounded-control p-2 text-ink-muted hover:bg-surface-muted"
              onClick={onClickDownload}
            />
            <AiOutlineEdit
              className="size-touch rounded-control p-2 text-ink-muted hover:bg-surface-muted"
              onClick={onClickEdit}
            />
            <AiOutlineDelete
              className="size-touch rounded-control p-2 text-danger hover:bg-surface-muted"
              onClick={onClickDelete}
            />
            {Boolean(deck.url) && (
              <AiOutlineReload
                className="size-touch rounded-control p-2 text-ink-muted hover:bg-surface-muted"
                onClick={onClickReimport}
              />
            )}
          </div>
        </div>
      </Card>
    </IconContext.Provider>
  );
};
