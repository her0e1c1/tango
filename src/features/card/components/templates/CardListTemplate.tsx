/**
 * @file Composes the card feature's complete Card List Template screen.
 * Data and callbacks arrive through props, which keeps this presentation usable in both a live
 * container and Storybook.
 */

import * as React from "react";
import { AiOutlineDown } from "react-icons/ai";

import { BackText, type BackTextProps } from "@/features/card/components/BackText";
import { Card, type CardProps } from "@/features/card/components/Card";
import { Overlay, RemovableTag } from "@/components";
import { Layout, type LayoutProps } from "@/components/layout/Layout";

export interface CardListOverlayProps {
  backText: BackTextProps;
  onClose?: () => void;
}

export interface CardListFilterState {
  scoreMax: number | null;
  scoreMin: number | null;
  selectedTags: string[];
}

export interface CardListTemplateProps {
  cards: Card[];
  layout?: LayoutProps;
  filter?: CardListFilterState;
  filterSlot?: React.ReactNode;
  card?: CardProps;
  overlay?: CardListOverlayProps;
  onShowCard?: (card: Card) => void;
  onRemoveTag?: (tag: string) => void;
  feedbackSlot?: React.ReactNode;
  isCardPending?: (id: CardId) => boolean;
}

/**
 * Formats the count label text shown to the user.
 * The helper keeps wording and singular or plural rules consistent across the screen.
 */
const countLabel = (count: number) => `${count} ${count === 1 ? "card" : "cards"}`;

/**
 * Formats the score range label text shown to the user.
 * The helper keeps wording and singular or plural rules consistent across the screen.
 */
const scoreRangeLabel = (filter: CardListFilterState) => {
  if (filter.scoreMin != null && filter.scoreMax != null) return `score ${filter.scoreMin}–${filter.scoreMax}`;
  if (filter.scoreMin != null) return `score ≥ ${filter.scoreMin}`;
  if (filter.scoreMax != null) return `score ≤ ${filter.scoreMax}`;
  return undefined;
};

/**
 * Formats the filter label text shown to the user.
 * The helper keeps wording and singular or plural rules consistent across the screen.
 */
const filterLabel = (filter: CardListFilterState) => {
  const labels: string[] = [];
  const score = scoreRangeLabel(filter);
  if (score != null) labels.push(score);
  if (filter.selectedTags.length > 0) {
    labels.push(`${filter.selectedTags.length} ${filter.selectedTags.length === 1 ? "tag" : "tags"}`);
  }
  return labels.length > 0 ? labels.join(" · ") : "No filters";
};

const emptyFilter: CardListFilterState = { scoreMax: null, scoreMin: null, selectedTags: [] };

/**
 * Composes the complete Card List Rows screen from reusable UI components.
 * All data and callbacks arrive through props, allowing the same screen to run in containers,
 * tests, and Storybook.
 */
const CardListRows: React.FC<Pick<CardListTemplateProps, "cards" | "card" | "onShowCard" | "isCardPending">> = (
  props
) => {
  const [openMenuCardId, setOpenMenuCardId] = React.useState<CardId>();

  return (
    <div className="overflow-visible rounded-surface border border-border bg-surface shadow-surface">
      {props.cards.map((card) => (
        <Card
          key={card.id}
          card={card}
          disabled={props.isCardPending?.(card.id) ?? false}
          menuOpen={openMenuCardId === card.id}
          onToggleMenu={(id) => setOpenMenuCardId((value) => (value === id ? undefined : id))}
          onCloseMenu={() => setOpenMenuCardId(undefined)}
          {...(props.card?.onSwipedLeft !== undefined ? { onSwipedLeft: props.card.onSwipedLeft } : {})}
          {...(props.card?.onSwipedRight !== undefined ? { onSwipedRight: props.card.onSwipedRight } : {})}
          {...(props.card?.onDelete !== undefined ? { onDelete: props.card.onDelete } : {})}
          {...(props.card?.goToEdit !== undefined ? { goToEdit: props.card.goToEdit } : {})}
          goToView={() => {
            setOpenMenuCardId(undefined);
            props.onShowCard?.(card);
          }}
        />
      ))}
    </div>
  );
};

/**
 * Composes the complete Card List Template screen from reusable UI components.
 * All data and callbacks arrive through props, allowing the same screen to run in containers,
 * tests, and Storybook.
 */
export const CardListTemplate: React.FC<CardListTemplateProps> = (props) => {
  const filter = props.filter ?? emptyFilter;

  return (
    <Layout showHeader {...props.layout}>
      {props.feedbackSlot}
      {props.overlay != null && (
        <Overlay
          position="center"
          ariaLabel="Close card"
          className="overflow-y-auto bg-surface-elevated"
          {...(props.overlay.onClose !== undefined ? { onClick: props.overlay.onClose } : {})}
        >
          <BackText {...props.overlay.backText} />
        </Overlay>
      )}

      <div className="flex items-baseline justify-between gap-3">
        <h1 className="break-words text-title font-bold text-ink">Cards</h1>
        <span className="shrink-0 text-caption text-ink-muted">{countLabel(props.cards.length)}</span>
      </div>

      <div className="flex flex-col gap-2">
        <details className="group rounded-surface border border-border bg-surface shadow-surface">
          <summary className="flex min-h-touch cursor-pointer list-none items-center justify-between gap-3 rounded-surface px-3 font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus [&::-webkit-details-marker]:hidden">
            <span>Filters</span>
            <span className="flex min-w-0 items-center gap-2">
              <span className="min-w-0 truncate text-caption font-medium text-ink-muted">{filterLabel(filter)}</span>
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
          <ul aria-label="Selected tags" className="flex min-w-0 max-w-full list-none flex-wrap gap-2 px-1">
            {filter.selectedTags.map((tag) => (
              <li key={tag} className="max-w-full">
                <RemovableTag label={tag} onRemove={(value) => props.onRemoveTag?.(value)} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {props.cards.length > 0 && (
        <CardListRows
          key={JSON.stringify(props.cards.map((card) => card.id))}
          cards={props.cards}
          {...(props.card !== undefined ? { card: props.card } : {})}
          {...(props.onShowCard !== undefined ? { onShowCard: props.onShowCard } : {})}
          {...(props.isCardPending !== undefined ? { isCardPending: props.isCardPending } : {})}
        />
      )}
    </Layout>
  );
};
