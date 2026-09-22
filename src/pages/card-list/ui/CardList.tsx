/**
 * @file Composes the Card List Page's presentation.
 * Data and callbacks arrive through props, which keeps this presentation usable in Storybook.
 */

import type { TFunction } from "i18next";
import * as React from "react";
import { AiOutlineDown, AiOutlinePlus, AiOutlineSliders } from "react-icons/ai";
import { useTranslation } from "react-i18next";

import type { CardId } from "@/entities/card";
import { ActionsMenu } from "@/shared/ui/actions-menu";
import { Button } from "@/shared/ui/button";
import { RemovableTag } from "@/shared/ui/content";
import { Select } from "@/shared/ui/forms";
import { Overlay } from "@/shared/ui/feedback";

import { Card, type CardActionsProps } from "./Card";

interface CardListItem {
  id: CardId;
  frontText: string;
  difficulty: number;
  numberOfSeen: number;
  tags: string[];
}

interface CardListOverlayProps {
  content: React.ReactNode;
  onClose?: () => void;
}

interface CardListFilterState {
  difficultyMax: number | null;
  difficultyMin: number | null;
  selectedTags: string[];
}

type CardListEmptyReason = "no-cards" | "filter-zero" | "interval-zero";

interface CardListEmptyProps {
  reason: CardListEmptyReason;
  onAddCard?: (() => void) | undefined;
  onClearFilters?: (() => void) | undefined;
}

export interface CardListProps {
  cards: CardListItem[];
  empty?: CardListEmptyProps | undefined;
  sortOrder?: "standard" | "newest";
  onSortOrderChange?: (value: "standard" | "newest") => void;
  sortDisabled?: boolean;
  filterDisabled?: boolean;
  onChangeDifficulty?: () => void;
  disabled?: boolean;
  filter?: CardListFilterState;
  filterSlot?: React.ReactNode;
  card?: CardActionsProps;
  overlay?: CardListOverlayProps;
  onShowCard?: (id: CardId) => void;
  onRemoveTag?: (tag: string) => void;
  onAddCard?: () => void;
  renderDifficulty?: (difficulty: number) => React.ReactNode;
}

/**
 * Formats the difficulty range label text shown to the user.
 * The helper keeps wording consistent with the active locale across the screen.
 */
const difficultyRangeLabel = (filter: CardListFilterState, t: TFunction) => {
  if (filter.difficultyMin != null && filter.difficultyMax != null) {
    return t("cardList.filters.difficultyRange", {
      minimum: filter.difficultyMin,
      maximum: filter.difficultyMax,
    });
  }
  if (filter.difficultyMin != null) {
    return t("cardList.filters.difficultyMinimum", { minimum: filter.difficultyMin });
  }
  if (filter.difficultyMax != null) {
    return t("cardList.filters.difficultyMaximum", { maximum: filter.difficultyMax });
  }
  return null;
};

/**
 * Formats the filter label text shown to the user.
 * The helper keeps wording and singular or plural rules consistent across the screen.
 */
const filterLabel = (filter: CardListFilterState, t: TFunction) => {
  const labels: string[] = [];
  const difficulty = difficultyRangeLabel(filter, t);
  if (difficulty != null) labels.push(difficulty);
  if (filter.selectedTags.length > 0) {
    labels.push(t("cardList.filters.tagCount", { count: filter.selectedTags.length }));
  }
  return labels.length > 0 ? labels.join(" · ") : t("cardList.filters.noFilters");
};

const emptyFilter: CardListFilterState = { difficultyMax: null, difficultyMin: null, selectedTags: [] };

/**
 * Composes the complete Card List Rows screen from reusable UI components.
 * All data and callbacks arrive through props, allowing the same screen to run in tests and
 * Storybook.
 */
const CardListRows: React.FC<Pick<CardListProps, "cards" | "card" | "disabled" | "onShowCard" | "renderDifficulty">> = (
  props
) => {
  const [openMenuCardId, setOpenMenuCardId] = React.useState<CardId>();
  // Clear a removed target without remounting surviving rows and losing keyboard focus.
  if (openMenuCardId !== undefined && !props.cards.some((card) => card.id === openMenuCardId)) {
    setOpenMenuCardId(undefined);
  }

  return (
    <div className="overflow-visible rounded-surface border border-border bg-surface shadow-surface dark:border-black">
      {props.cards.map((card) => (
        <Card
          key={card.id}
          card={card}
          disabled={Boolean(props.disabled || props.card?.disabled)}
          difficultySlot={props.renderDifficulty?.(card.difficulty)}
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
  const [actionsOpen, setActionsOpen] = React.useState(false);
  const sortId = React.useId();
  const summaryRef = React.useRef<HTMLElement>(null);
  const tagRefs = React.useRef<Map<string, HTMLButtonElement>>(new Map());

  const handleRemoveTag = (tag: string) => {
    const currentIndex = filter.selectedTags.indexOf(tag);
    const nextSelectedTags = filter.selectedTags.filter((selectedTag) => selectedTag !== tag);

    if (nextSelectedTags.length === 0) {
      // Removing the final chip unmounts the list. Move focus to the visible Filters
      // disclosure so keyboard navigation remains unbroken on the screen.
      summaryRef.current?.focus();
    } else {
      // Move focus to a neighboring chip before removing this one so keyboard focus stays
      // visible and predictable instead of falling back to document body.
      const targetIndex = currentIndex < nextSelectedTags.length ? currentIndex : nextSelectedTags.length - 1;
      const targetTag = nextSelectedTags[targetIndex];
      const targetButton = targetTag !== undefined ? tagRefs.current.get(targetTag) : undefined;
      (targetButton ?? summaryRef.current)?.focus();
    }

    props.onRemoveTag?.(tag);
  };

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
          {(props.onAddCard !== undefined || props.onChangeDifficulty !== undefined) && (
            <ActionsMenu
              groupLabel={t("cardList.listActions")}
              triggerLabel={t("cardList.listActions")}
              menuLabel={t("cardList.listActions")}
              triggerContent={
                <>
                  {t("cardList.listActions")}
                  <AiOutlineDown aria-hidden="true" />
                </>
              }
              open={actionsOpen}
              disabled={Boolean(props.disabled)}
              onToggle={() => setActionsOpen((open) => !open)}
              onClose={() => setActionsOpen(false)}
              items={[
                {
                  key: "add",
                  label: t("cardList.add"),
                  icon: <AiOutlinePlus aria-hidden="true" />,
                  onSelect: () => props.onAddCard?.(),
                },
                {
                  key: "difficulty",
                  label: t("cardList.bulkDifficulty.title"),
                  icon: <AiOutlineSliders aria-hidden="true" />,
                  onSelect: () => props.onChangeDifficulty?.(),
                },
              ]}
            />
          )}
        </div>
      </div>

      <label htmlFor={sortId} className="flex flex-wrap items-center gap-2 text-caption font-medium text-ink">
        {t("cardList.sort.label")}
        <Select
          id={sortId}
          className="w-auto"
          value={props.sortOrder ?? "standard"}
          disabled={props.sortDisabled}
          onChange={(event) => props.onSortOrderChange?.(event.target.value === "newest" ? "newest" : "standard")}
          options={[
            { value: "standard", label: t("cardList.sort.standard") },
            { value: "newest", label: t("cardList.sort.newest") },
          ]}
        />
      </label>

      <fieldset className="contents" disabled={props.filterDisabled ?? props.disabled}>
        <div className="flex flex-col gap-2">
          <details className="group rounded-surface border border-border bg-surface shadow-surface">
            <summary
              ref={summaryRef}
              className="flex min-h-touch cursor-pointer list-none items-center justify-between gap-3 rounded-surface px-3 font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus [&::-webkit-details-marker]:hidden"
            >
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
                  <RemovableTag
                    ref={(element) => {
                      if (element) {
                        tagRefs.current.set(tag, element);
                      } else {
                        tagRefs.current.delete(tag);
                      }
                    }}
                    label={tag}
                    onRemove={handleRemoveTag}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </fieldset>

      {props.cards.length > 0 ? (
        <CardListRows
          cards={props.cards}
          disabled={Boolean(props.disabled)}
          {...(props.card !== undefined ? { card: props.card } : {})}
          {...(props.onShowCard !== undefined ? { onShowCard: props.onShowCard } : {})}
          {...(props.renderDifficulty !== undefined ? { renderDifficulty: props.renderDifficulty } : {})}
        />
      ) : props.empty ? (
        <section
          aria-labelledby="card-list-empty-title"
          className="rounded-surface border border-border bg-surface p-6 text-center text-ink shadow-surface"
        >
          <h2 id="card-list-empty-title" className="text-title font-semibold text-ink">
            {props.empty.reason === "no-cards"
              ? t("cardList.empty.noCardsTitle")
              : props.empty.reason === "filter-zero"
                ? t("cardList.empty.filterZeroTitle")
                : t("cardList.empty.intervalZeroTitle")}
          </h2>
          <p className="mt-2 text-body text-ink-muted">
            {props.empty.reason === "no-cards"
              ? t("cardList.empty.noCardsDescription")
              : props.empty.reason === "filter-zero"
                ? t("cardList.empty.filterZeroDescription")
                : t("cardList.empty.intervalZeroDescription")}
          </p>
          {props.empty.reason === "no-cards" && props.empty.onAddCard ? (
            <div className="mt-4 flex justify-center">
              <Button variant="primary" onClick={props.empty.onAddCard}>
                {t("cardList.add")}
              </Button>
            </div>
          ) : props.empty.reason === "filter-zero" && props.empty.onClearFilters ? (
            <div className="mt-4 flex justify-center">
              <Button variant="secondary" onClick={props.empty.onClearFilters}>
                {t("cardList.empty.clearFilters")}
              </Button>
            </div>
          ) : null}
        </section>
      ) : null}
    </>
  );
};
