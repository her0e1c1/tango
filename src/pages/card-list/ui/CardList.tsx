/**
 * @file Composes the Card List Page's presentation.
 * Data and callbacks arrive through props, which keeps this presentation usable in Storybook.
 */

import type { TFunction } from "i18next";
import * as React from "react";
import { AiOutlineDown, AiOutlinePlus } from "react-icons/ai";
import { useTranslation } from "react-i18next";

import type { CardId } from "@/entities/card";
import { Button } from "@/shared/ui/button";
import { RemovableTag } from "@/shared/ui/content";
import { Overlay } from "@/shared/ui/feedback";

import { Card, type CardActionsProps } from "./Card";

interface CardListItem {
  id: CardId;
  frontText: string;
  score: number;
  numberOfSeen: number;
  tags: string[];
}

interface CardListOverlayProps {
  content: React.ReactNode;
  onClose?: () => void;
}

interface CardListFilterState {
  scoreMax: number | null;
  scoreMin: number | null;
  selectedTags: string[];
}

export interface CardListProps {
  cards: CardListItem[];
  disabled?: boolean;
  filter?: CardListFilterState;
  filterSlot?: React.ReactNode;
  card?: CardActionsProps;
  overlay?: CardListOverlayProps;
  onShowCard?: (id: CardId) => void;
  onRemoveTag?: (tag: string) => void;
  onAddCard?: () => void;
}

/**
 * Formats the score range label text shown to the user.
 * The helper keeps wording and singular or plural rules consistent across the screen.
 */
const scoreRangeLabel = (filter: CardListFilterState, t: TFunction) => {
  if (filter.scoreMin != null && filter.scoreMax != null) {
    return t("cardList.filters.scoreRange", { minimum: filter.scoreMin, maximum: filter.scoreMax });
  }
  if (filter.scoreMin != null) return t("cardList.filters.scoreMinimum", { minimum: filter.scoreMin });
  if (filter.scoreMax != null) return t("cardList.filters.scoreMaximum", { maximum: filter.scoreMax });
  return null;
};

/**
 * Formats the filter label text shown to the user.
 * The helper keeps wording and singular or plural rules consistent across the screen.
 */
const filterLabel = (filter: CardListFilterState, t: TFunction) => {
  const labels: string[] = [];
  const score = scoreRangeLabel(filter, t);
  if (score != null) labels.push(score);
  if (filter.selectedTags.length > 0) {
    labels.push(t("cardList.filters.tagCount", { count: filter.selectedTags.length }));
  }
  return labels.length > 0 ? labels.join(" · ") : t("cardList.filters.noFilters");
};

const emptyFilter: CardListFilterState = { scoreMax: null, scoreMin: null, selectedTags: [] };

/**
 * Composes the complete Card List Rows screen from reusable UI components.
 * All data and callbacks arrive through props, allowing the same screen to run in tests and
 * Storybook.
 */
const CardListRows: React.FC<Pick<CardListProps, "cards" | "card" | "disabled" | "onShowCard">> = (props) => {
  const [openMenuCardId, setOpenMenuCardId] = React.useState<CardId>();

  return (
    <div className="overflow-visible rounded-surface border border-border bg-surface shadow-surface dark:border-black">
      {props.cards.map((card) => (
        <Card
          key={card.id}
          card={card}
          disabled={Boolean(props.disabled || props.card?.disabled)}
          menuOpen={openMenuCardId === card.id}
          onToggleMenu={(id) => setOpenMenuCardId((value) => (value === id ? undefined : id))}
          onCloseMenu={() => setOpenMenuCardId(undefined)}
          {...(props.card?.onSwipedLeft !== undefined ? { onSwipedLeft: props.card.onSwipedLeft } : {})}
          {...(props.card?.onSwipedRight !== undefined ? { onSwipedRight: props.card.onSwipedRight } : {})}
          {...(props.card?.onDelete !== undefined ? { onDelete: props.card.onDelete } : {})}
          {...(props.card?.goToEdit !== undefined ? { goToEdit: props.card.goToEdit } : {})}
          goToView={() => {
            setOpenMenuCardId(undefined);
            props.onShowCard?.(card.id);
          }}
        />
      ))}
    </div>
  );
};

/**
 * Composes the Card List screen from reusable UI components.
 * All data and callbacks arrive through props, allowing the same screen to run in tests and
 * Storybook.
 */
export const CardList: React.FC<CardListProps> = (props) => {
  const { t } = useTranslation();
  const filter = props.filter ?? emptyFilter;

  return (
    <>
      {props.overlay != null && (
        <Overlay
          position="center"
          ariaLabel={t("cardList.closeCard")}
          className="overflow-y-auto bg-surface-elevated"
          {...(props.overlay.onClose !== undefined ? { onClick: props.overlay.onClose } : {})}
        >
          {props.overlay.content}
        </Overlay>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="break-words text-title font-bold text-ink">{t("cardList.title")}</h1>
        <div className="flex items-center gap-3">
          <span className="shrink-0 text-caption text-ink-muted">
            {t("cardList.count", { count: props.cards.length })}
          </span>
          {props.onAddCard !== undefined && (
            <Button variant="primary" type="button" disabled={Boolean(props.disabled)} onClick={props.onAddCard}>
              <AiOutlinePlus aria-hidden="true" />
              {t("cardList.add")}
            </Button>
          )}
        </div>
      </div>

      <fieldset className="contents" disabled={props.disabled}>
        <div className="flex flex-col gap-2">
          <details className="group rounded-surface border border-border bg-surface shadow-surface">
            <summary className="flex min-h-touch cursor-pointer list-none items-center justify-between gap-3 rounded-surface px-3 font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus [&::-webkit-details-marker]:hidden">
              <span>{t("cardList.filters.title")}</span>
              <span className="flex min-w-0 items-center gap-2">
                <span className="min-w-0 truncate text-caption font-medium text-ink-muted">
                  {filterLabel(filter, t)}
                </span>
                <AiOutlineDown
                  aria-hidden="true"
                  className="shrink-0 text-ink-muted transition-transform group-open:rotate-180 motion-reduce:transition-none"
                  size={16}
                />
              </span>
            </summary>
            <div className="border-t border-border p-3">{props.filterSlot}</div>
          </details>
          {filter.selectedTags.length > 0 && (
            <ul
              aria-label={t("cardList.filters.selectedTags")}
              className="flex min-w-0 max-w-full list-none flex-wrap gap-2 px-1"
            >
              {filter.selectedTags.map((tag) => (
                <li key={tag} className="max-w-full">
                  <RemovableTag label={tag} onRemove={(value) => props.onRemoveTag?.(value)} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </fieldset>

      {props.cards.length > 0 && (
        <CardListRows
          key={JSON.stringify(props.cards.map((card) => card.id))}
          cards={props.cards}
          disabled={Boolean(props.disabled)}
          {...(props.card !== undefined ? { card: props.card } : {})}
          {...(props.onShowCard !== undefined ? { onShowCard: props.onShowCard } : {})}
        />
      )}
    </>
  );
};
