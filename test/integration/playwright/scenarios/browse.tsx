import { useState } from "react";
import { I18nProvider } from "@/app/i18n";
import { appI18n } from "@/app/i18n/instance";
import { calculateFsrsState, getCards } from "@/entities/card";
import { getDecks } from "@/entities/deck";
import { getPreferences, toggleViewMode } from "@/entities/preference";
import { getStudySession } from "@/entities/study-session";
import { TagFilter } from "@/features/deck-filter/ui/TagFilter";
import { DeckFilterForm } from "@/features/deck-filter/ui/DeckFilterForm";
import { CardList } from "@/pages/card-list/ui/CardList";
import { CardActionsMenu } from "@/pages/card-list/ui/CardActionsMenu";
import { showToast } from "@/shared/ui/toast";
import { createCard, createDeck } from "@/test/factories";
import { replaceRemoteCards } from "@/test/utils/entityFixtures";
import { prepareApp, renderRoutes, io } from "../support";

const now = Date.UTC(2026, 6, 1, 12);
const uid = "playwright-user";
const deck = createDeck({
  id: "browse-deck",
  uid,
  name: "Japanese verbs",
  category: "math",
  createdAt: now,
  updatedAt: now,
});
const otherDeck = createDeck({
  id: "browse-other",
  uid,
  name: "Other deck",
  category: "python",
  createdAt: now,
  updatedAt: now,
});
const cards = ["Hello", "Second", "Third", "Fourth", "Fifth"].map((frontText, index) =>
  createCard({
    id: `browse-card-${index}`,
    deckId: deck.id,
    uid,
    frontText,
    backText: index === 0 ? "Hola" : `${frontText} answer`,
    tags: index === 0 ? ["A"] : index === 1 ? ["B"] : ["A", "B"],
    uniqueKey: `key-${index}`,
    createdAt: now + index,
    updatedAt: now + index,
  })
);
const otherCard = createCard({
  id: "browse-other-card",
  deckId: otherDeck.id,
  uid,
  frontText: "Other prompt",
  backText: "Other answer",
  createdAt: now,
  updatedAt: now,
});
const tagNames = Array.from({ length: 12 }, (_, i) => `tag-${String(i + 1).padStart(2, "0")}`);
const longTag = "averylongunbrokentag".repeat(12);
const longAnswer = Array.from(
  { length: 120 },
  (_, i) => `Paragraph ${i + 1}: Read this long answer without changing the card.`
).join("\n\n");
const previewAnswer = `Selectable answer text.\n\n[Reference](#user-content-fn-1) and a note[^1].\n\n\`\`\`text\n${"wide-code-".repeat(100)}\n\`\`\`\n\n$$\n\\underbrace{${"x+".repeat(95)}x}_{wide}\n$$\n\n${Array.from({ length: 30 }, (_, i) => `Reading paragraph ${i + 1}.`).join("\n\n")}\n\n[^1]: Footnote answer.`;
const observations: { name: string; value?: unknown }[] = [];
const record = (name: string, value?: unknown) => observations.push({ name, value });
let deletion = Promise.withResolvers<void>();

export const getObservations = () => observations;
export const finishDelete = () => deletion.resolve();
export const changeLanguage = (language: string) => appI18n.changeLanguage(language);
export const readingMode = () => toggleViewMode();
export const navigate = (path: string) => {
  window.history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
};
export const notify = () => showToast({ messageKey: "toast.saveFailure", tone: "warning" });
export const getPreviewState = () =>
  JSON.stringify({
    cards: getCards(),
    decks: getDecks(),
    preferences: getPreferences(),
    session: getStudySession(deck.id),
  });
export const getNonFilterState = () =>
  JSON.stringify({
    cards: getCards(),
    decks: getDecks().map(({ cardFilter: _filter, updatedAt: _updatedAt, ...value }) => value),
    preferences: getPreferences(),
    session: getStudySession(deck.id),
  });
export function updateCards(kind: string) {
  if (kind === "empty") replaceRemoteCards([]);
  if (kind === "remove-second") replaceRemoteCards(getCards().filter((card) => card.id !== cards[1]!.id));
  if (kind === "restore") replaceRemoteCards(cards);
  if (kind === "reorder")
    replaceRemoteCards(getCards().map((card) => (card.id === cards[0]!.id ? { ...card, createdAt: now + 100 } : card)));
  if (kind === "snapshot")
    replaceRemoteCards(
      getCards().map((card) =>
        card.id === cards[0]!.id
          ? { ...card, frontText: "Updated Hello", backText: "const updated = true;", tags: ["typescript"] }
          : card
      )
    );
}

function ComponentFilter({ variant }: { variant: string }) {
  let options = Array.from({ length: 12 }, (_, i) => `tag-${i + 1}`);
  let selected: string[] = [];
  if (variant === "selection") options = ["one", "two"];
  if (variant.startsWith("duplicates")) {
    options = ["one", "two"];
    selected = ["one", "one"];
  }
  if (variant === "hidden") selected = ["tag-12"];
  if (variant === "stale") {
    options = [];
    selected = ["stale"];
  }
  if (variant === "eight") options = options.slice(0, 8);
  if (variant === "empty-all") options = [];
  if (variant === "many") {
    options = Array.from({ length: 120 }, (_, i) => `tag-${i + 1}`);
    selected = options;
  }
  if (variant === "long") options = [longTag];
  if (variant === "unavailable") {
    options = [
      "one",
      "two",
      "three",
      "four",
      "five",
      "six",
      "seven",
      "eight",
      "nine",
      "ten",
      "eleven",
      "twelve",
      "two",
    ];
    selected = ["stale", "four", "stale"];
  }
  if (variant === "language") options = options.slice(0, 10);
  const [tags, setTags] = useState(selected);
  const [matchAll, setMatchAll] = useState(variant === "empty-all" || variant === "many");
  return (
    <TagFilter
      tags={options}
      selectedTags={tags}
      matchAll={matchAll}
      onSelectedTagsChange={(value) => {
        record("tags", value);
        setTags(value);
      }}
      onMatchAllChange={(value) => {
        record("matchAll", value);
        setMatchAll(value);
      }}
    />
  );
}

function ComponentList({ variant }: { variant: string }) {
  const [values, setValues] = useState(cards.slice(0, 2));
  const [tags, setTags] = useState(["one", "two"]);
  const [previewOpen, setPreviewOpen] = useState(variant === "preview");
  return (
    <>
      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setValues((current) => [...current].reverse())}
      >
        Reverse rows
      </button>
      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() =>
          setValues((current) =>
            current.length === 2 ? current.filter((card) => card.id !== cards[1]!.id) : cards.slice(0, 2)
          )
        }
      >
        Toggle Second
      </button>
      <CardList
        cards={["unknown", "interval", "empty-add", "empty-clear"].includes(variant) ? [] : values}
        {...(variant === "interval" ? { empty: { reason: "interval-zero" as const } } : {})}
        {...(variant === "empty-add"
          ? { empty: { reason: "no-cards" as const, onAddCard: () => record("empty-add") } }
          : {})}
        {...(variant === "empty-clear"
          ? { empty: { reason: "filter-zero" as const, onClearFilters: () => record("empty-clear") } }
          : {})}
        filter={{ selectedTags: variant === "keyboard" ? tags : [] }}
        onRemoveTag={(tag) => {
          record("remove", tag);
          setTags((current) => current.filter((value) => value !== tag));
        }}
        onAddCard={() => record("add")}
        onSortOrderChange={(value) => record("sort", value)}
        {...(previewOpen
          ? {
              preview: {
                title: "Code answer",
                content: "Preview content",
                onClose: () => {
                  record("close");
                  setPreviewOpen(false);
                },
              },
            }
          : {})}
        onShowCard={(id) => record("view", id)}
        card={{ goToEdit: (id) => record("edit", id) }}
      />
    </>
  );
}

function Menu({ disabled }: { disabled: boolean }) {
  const [open, setOpen] = useState(disabled);
  return (
    <CardActionsMenu
      cardText="Binary search"
      open={open}
      disabled={disabled}
      onToggle={() => setOpen((value) => !value)}
      onClose={() => setOpen(false)}
      onEdit={() => record("edit")}
      onDelete={() => record("delete")}
    />
  );
}

function Form() {
  const [tags, setTags] = useState(["tag 1"]);
  return (
    <DeckFilterForm
      tags={["tag 1", "tag 2"]}
      selectedTags={tags}
      tagAndFilter={false}
      setSelectedTags={(value) => {
        record("tags", value);
        setTags(value);
      }}
      setTagAndFilter={() => undefined}
    />
  );
}

function mixedCards() {
  return [
    ...["due tagged card", "future tagged card", "new tagged card", "excluded study tag card"].map((frontText, i) => ({
      ...cards[i]!,
      frontText,
      tags: [["target", "alpha"], ["target", "beta"], ["target", "alpha", "beta"], ["other"]][i]!,
      fsrs:
        i < 2 ? { ...calculateFsrsState(null, "good", now), dueAt: now + (i === 0 ? -86_400_000 : 86_400_000) } : null,
    })),
    {
      ...otherCard,
      frontText: "future only card",
      tags: ["target"],
      fsrs: { ...calculateFsrsState(null, "good", now), dueAt: now + 86_400_000 },
    },
  ];
}
function playerCards(variant: string) {
  if (["reading", "front-reading"].includes(variant))
    return [
      {
        ...cards[0]!,
        ...(variant === "reading" ? { backText: longAnswer } : { frontText: longAnswer }),
        tags: ["raw"],
      },
      ...cards.slice(1),
    ];
  if (["order", "difficulty"].includes(variant))
    return [
      cards[0]!,
      { ...cards[1]!, fsrs: { ...calculateFsrsState(null, "good", now), dueAt: now + 86_400_000 } },
      ...(variant === "order" ? [otherCard] : []),
    ];
  return [...cards, otherCard];
}
function cardValues(variant: string) {
  if (variant.startsWith("mixed")) return mixedCards();
  if (variant.startsWith("sort"))
    return cards.slice(0, 3).map((card, i) => ({
      ...card,
      frontText: ["oldest question", "newest question", "tied question"][i]!,
      backText: ["oldest answer", "newest answer", "tied answer"][i]!,
      createdAt: i === 0 ? 1000 : 3000,
      updatedAt: i === 0 ? 9000 : 3000,
      tags: i === 2 ? ["other"] : ["shared"],
    }));
  switch (variant) {
    case "none":
    case "deck-empty":
      return [];
    case "future":
      return cards.map((card) => ({
        ...card,
        fsrs: { ...calculateFsrsState(null, "good", now), dueAt: now + 86_400_000 },
      }));
    case "tags":
      return cards.slice(0, 3);
    case "more":
    case "disappear":
      return tagNames.map((tag, i) => ({
        ...cards[0]!,
        id: `tag-card-${i}`,
        frontText: `Tagged ${i + 1}`,
        tags: [tag],
      }));
    case "no-tags":
      return cards.map((card) => ({ ...card, tags: [] }));
    case "long-list":
      return [{ ...cards[0]!, tags: [longTag] }];
    case "snapshot":
      return cards.map((card, i) => (i === 0 ? { ...card, backText: "Original answer\n\n".repeat(90) } : card));
    case "preview-rich":
      return [{ ...cards[0]!, frontText: "Reading card", backText: previewAnswer, tags: ["reading"] }];
    case "orphan":
      return [
        { ...cards[0]!, tags: ["shared", "kept"] },
        { ...cards[1]!, tags: ["shared"] },
        { ...otherCard, tags: ["other-only"] },
      ];
    default:
      return playerCards(variant);
  }
}
function selectedValues(variant: string): string[] {
  const selections: Record<string, string[]> = {
    unmatched: ["missing"],
    "deck-unmatched": ["missing"],
    selected: ["A", "B"],
    disappear: ["tag-12"],
    "stale-list": ["missing", "A"],
    "long-list": [longTag],
    "mixed-all": ["alpha", "beta"],
    "mixed-any": ["alpha", "beta"],
    "mixed-missing": ["missing"],
    "mixed-no-match": ["target", "other"],
    "sort-filtered": ["shared"],
  };
  return variant === "many-list"
    ? Array.from({ length: 80 }, (_, i) => `Selected tag ${i + 1}`)
    : (selections[variant] ?? []);
}
function sessionValues(variant: string) {
  if (variant !== "snapshot" && !variant.startsWith("sort")) return {};
  return {
    sessionsByDeckId: {
      [deck.id]: {
        sessionId: "preview-session",
        cardOrderIds: variant.startsWith("sort")
          ? [cards[0]!.id, cards[2]!.id, cards[1]!.id]
          : cards.map((card) => card.id),
        currentIndex: variant.startsWith("sort") ? 1 : 0,
        lastStudiedAt: now,
        startedAt: now,
      },
    },
  };
}
export default function browse(params: URLSearchParams) {
  const variant = params.get("variant") ?? "list";
  observations.length = 0;
  deletion = Promise.withResolvers<void>();
  const values = cardValues(variant);
  const selectedTags = selectedValues(variant);
  const tagAndFilter = ["selected", "no-tags", "mixed-all", "mixed-no-match"].includes(variant);
  const controls = {
    showPlaybackControls: !["swipe-only", "no-bottom"].includes(variant),
    showSwipeButtonList: !["playback-only", "no-bottom", "gestures"].includes(variant),
    showHelp: true,
    showCardDetails: true,
  };
  const cardInterval = variant === "unavailable" ? 0 : 60;
  prepareApp({
    decks: [
      {
        ...deck,
        ...(variant.startsWith("mixed") ? { studyFilter: { selectedTags: ["target"], tagAndFilter: false } } : {}),
        cardFilter: { selectedTags, tagAndFilter },
      },
      otherDeck,
    ],
    cards: values,
    preferences: {
      loadSample: false,
      study: {
        cardInterval,
        useCardInterval: variant === "future" || variant === "order" || variant.startsWith("mixed"),
        maxNumberOfCardsToLearn: variant.startsWith("mixed") ? 1 : 100,
        shuffled: variant.startsWith("mixed"),
      },
      controls,
    },
    ...sessionValues(variant),
  });
  if (variant === "deletion") {
    const original = io.deleteCard;
    io.deleteCard = async (...args) => {
      await deletion.promise;
      await original(...args);
    };
  }
  return renderBrowse(params, variant);
}

function renderBrowse(params: URLSearchParams, variant: string) {
  if (variant.startsWith("filter-component:"))
    return (
      <I18nProvider>
        <ComponentFilter variant={variant.split(":")[1]!} />
      </I18nProvider>
    );
  if (variant.startsWith("list-component:"))
    return (
      <I18nProvider>
        <ComponentList variant={variant.split(":")[1]!} />
      </I18nProvider>
    );
  if (variant === "form-component")
    return (
      <I18nProvider>
        <Form />
      </I18nProvider>
    );
  if (variant.startsWith("menu-component"))
    return (
      <I18nProvider>
        <Menu disabled={variant.endsWith("disabled")} />
      </I18nProvider>
    );
  const page = params.get("page") ?? "list";
  const path =
    page === "card"
      ? `/card/${params.get("missing") ? "missing" : cards[0]!.id}`
      : `/deck/${params.get("missing") ? "missing" : deck.id}${page === "deck" ? "/view" : ""}`;
  return renderRoutes(location.pathname === "/" ? path : location.pathname);
}
