import { appI18n } from "@/app/i18n/instance";
import { calculateFsrsState } from "@/entities/card";
import { getCards } from "@/entities/card";
import { getDecks } from "@/entities/deck";
import { getStudySession } from "@/entities/study-session";
import { ImportFailure } from "@/pages/deck-import/lib/importFailure";
import { deckImportStore } from "@/pages/deck-import/model/store";
import { createCard } from "@/test/factories";
import {
  cards,
  deck,
  state,
  now,
  uid,
  session,
  prepareApp,
  renderRoutes,
  io,
  events,
  type AppParameters,
} from "../support";

let pending: ReturnType<typeof Promise.withResolvers<void>> | undefined;
export function finish() {
  pending?.resolve();
}
export function setLanguage(language: string) {
  return appI18n.changeLanguage(language);
}
export function setBrowserLanguage(language: string) {
  Object.defineProperty(navigator, "language", { configurable: true, value: language });
  window.dispatchEvent(new Event("languagechange"));
}
export function inspect() {
  return {
    requests: events,
    deckWrites: events.filter((event) => event.name === "createDeck" || event.name === "editDeck"),
    cardWrites: events.filter((event) => ["createCard", "editCard", "deleteCard"].includes(event.name)),
    deletedDecks: events.filter((event) => event.name === "deleteDeck").map((event) => event.args[1]),
    studyRequests: events.filter((event) => event.name === "startStudy"),
    touchedDecks: events.filter((event) => event.name === "touchStudySession").map((event) => event.args[0]),
    downloads: events
      .filter((event) => event.name === "downloadTextFile")
      .map((event) => ({ content: event.args[0], fileName: event.args[1], mimeType: event.args[2] })),
    decks: getDecks(),
    cards: getCards(),
    sessions: getDecks().map(({ id }) => getStudySession(id)),
  };
}

function failure(kind: string) {
  if (kind === "authentication" || kind === "account-changed") return new ImportFailure(kind);
  if (kind === "permission") return { code: "permission-denied", message: "private diagnostic" };
  if (kind === "network") return { code: "unavailable", message: "private diagnostic" };
  if (kind === "storage") return new DOMException("private diagnostic", "QuotaExceededError");
  return new Error("private diagnostic");
}

function preparePrimaryReview(configuration: AppParameters, variant: string): AppParameters {
  if (variant === "one-review")
    configuration = {
      ...configuration,
      decks: [deck],
      cards: [
        { ...cards[0]!, fsrs: { ...calculateFsrsState(null, "good", now - 86_400_000), dueAt: now - 1 } },
        cards[1]!,
      ],
      preferences: { ...configuration.preferences, study: { ...state.preferences.study, useCardInterval: true } },
    };
  if (variant === "primary-review" || variant === "primary-new") {
    configuration = {
      ...configuration,
      decks: [deck],
      cards: cards.slice(0, variant === "primary-review" ? 3 : 2).map((card, index) => ({
        ...card,
        fsrs:
          variant === "primary-review" && index === 0
            ? { ...calculateFsrsState(null, "good", now - 86_400_000), dueAt: now - 1 }
            : null,
      })),
      preferences: { ...configuration.preferences, study: { ...state.preferences.study, useCardInterval: true } },
    };
  }
  return configuration;
}

function prepareReviewState(configuration: AppParameters, variant: string): AppParameters {
  configuration = preparePrimaryReview(configuration, variant);
  if (variant === "aggregate-review") {
    const extra = { ...deck, id: "extra-deck", name: "Extra deck" };
    const make = (deckId: string, due: number, fresh: number) =>
      Array.from({ length: due + fresh }, (_, index) =>
        createCard({
          ...cards[0]!,
          id: `${deckId}-card-${index}`,
          uniqueKey: `${deckId}-key-${index}`,
          deckId,
          fsrs: index < due ? { ...calculateFsrsState(null, "good", now - 86_400_000), dueAt: now - 1 } : null,
        })
      );
    configuration = {
      ...configuration,
      decks: [deck, state.decks[1]!, extra],
      cards: [...make(deck.id, 2, 1), ...make("other-deck", 3, 2), ...make(extra.id, 0, 2)],
      preferences: { ...configuration.preferences, study: { ...state.preferences.study, useCardInterval: true } },
    };
  }
  if (["review", "zero-review"].includes(variant)) {
    const reviewCards = cards.map((card, index) =>
      index < 2 ? { ...card, fsrs: { ...calculateFsrsState(null, "good", now - 86_400_000), dueAt: now - 1 } } : card
    );
    configuration = {
      ...configuration,
      cards:
        variant === "review"
          ? [...reviewCards, state.cards[5]!]
          : [
              ...cards,
              { ...state.cards[5]!, fsrs: { ...calculateFsrsState(null, "good", now), dueAt: now + 86_400_000 } },
            ],
      preferences: { ...configuration.preferences, study: { ...state.preferences.study, useCardInterval: true } },
    };
  }
  if (["no-held", "no-matches", "future"].includes(variant)) {
    configuration = {
      ...configuration,
      decks: [
        {
          ...deck,
          ...(variant === "no-matches" ? { studyFilter: { selectedTags: ["missing"], tagAndFilter: false } } : {}),
        },
      ],
      cards:
        variant === "no-held"
          ? []
          : cards
              .slice(0, 3)
              .map((card) =>
                variant === "future"
                  ? { ...card, fsrs: { ...calculateFsrsState(null, "good", now), dueAt: now + 86_400_000 } }
                  : card
              ),
      preferences: { ...configuration.preferences, study: { ...state.preferences.study, useCardInterval: true } },
    };
  }
  return prepareStudyPosition(configuration, variant);
}

function prepareStudyPosition(configuration: AppParameters, variant: string): AppParameters {
  if (["active", "position", "unknown-time"].includes(variant)) {
    const count = variant === "active" ? 5 : variant === "position" ? 8 : 2;
    const total = variant === "active" ? 5 : variant === "position" ? 3 : 2;
    const deckCards = Array.from({ length: count }, (_, index) =>
      index < cards.length ? cards[index]! : { ...cards[0]!, id: `position-${index}`, uniqueKey: `position-${index}` }
    );
    configuration = {
      ...configuration,
      cards: [...deckCards, state.cards[5]!],
      sessionsByDeckId: {
        [deck.id]: {
          ...session(variant === "active" ? 2 : 1, deckCards.slice(0, total))[deck.id]!,
          lastStudiedAt: variant === "unknown-time" ? 0 : now,
        },
      },
    };
  }
  return configuration;
}

function prepareListState(configuration: AppParameters, variant: string): AppParameters {
  if (["empty", "checking", "bootstrap-failure"].includes(variant)) {
    configuration = {
      ...configuration,
      decks: [],
      cards: [],
      preferences: { ...configuration.preferences, loadSample: variant !== "empty" },
    };
  }
  if (variant.startsWith("continue-"))
    configuration = {
      ...configuration,
      cards: [
        ...state.cards,
        { ...state.cards[5]!, id: "other-card-second", uniqueKey: "other-second", frontText: "Other second prompt" },
      ],
      sessionsByDeckId: {
        ...session(0),
        "other-deck": {
          sessionId: "other-session",
          cardOrderIds: [state.cards[5]!.id, "other-card-second"],
          currentIndex: 1,
          lastStudiedAt: now,
          startedAt: now,
        },
      },
    };
  if (variant === "reserved-identifiers")
    configuration = {
      ...configuration,
      decks: [
        deck,
        { ...deck, id: "deck-special", name: "Plain identifier" },
        { ...deck, id: "deck-special?#suffix", name: "Reserved identifier" },
      ],
      cards: [
        cards[0]!,
        createCard({ id: "plain-card", deckId: "deck-special", uid, frontText: "Plain prompt", uniqueKey: "plain" }),
        createCard({
          id: "reserved-card",
          deckId: "deck-special?#suffix",
          uid,
          frontText: "Reserved prompt",
          uniqueKey: "reserved",
        }),
      ],
    };
  if (variant === "deadline")
    configuration = {
      ...configuration,
      decks: [deck],
      cards: [
        { ...cards[0]!, fsrs: { ...calculateFsrsState(null, "good", now - 86_400_000), dueAt: now - 1 } },
        cards[1]!,
        { ...cards[2]!, fsrs: { ...calculateFsrsState(null, "good", now - 86_400_000), dueAt: now + 1000 } },
      ],
      preferences: { ...configuration.preferences, study: { ...state.preferences.study, useCardInterval: true } },
    };
  if (variant === "long-delete")
    configuration = {
      ...configuration,
      decks: [{ ...deck, name: `START ${"Long deletion target name ".repeat(12)}END` }, state.decks[1]!],
      sessionsByDeckId: session(2),
    };
  if (variant === "export-fields")
    configuration = {
      ...configuration,
      decks: [deck],
      cards: [
        createCard({
          ...cards[0]!,
          frontText: "Question, with comma",
          backText: 'Answer "with quotes"\nand newline',
          tags: ["first", "second"],
          uniqueKey: "export-one",
        }),
        createCard({ ...cards[1]!, frontText: "日本語", backText: "回答", tags: [], uniqueKey: "export-two" }),
      ],
    };
  if (variant === "study-without-opening" || variant === "edit-delete") {
    configuration = {
      ...configuration,
      cards: [
        ...Array.from({ length: 24 }, (_, index) =>
          createCard({ ...cards[0]!, id: `delete-card-${index}`, uniqueKey: `delete-key-${index}` })
        ),
        state.cards[5]!,
      ],
    };
  }
  if (variant === "local") configuration = { ...configuration, decks: [{ ...deck, uid: "" }], cards: [] };
  if (variant === "layout")
    configuration = {
      ...configuration,
      cards: [],
      decks: Array.from({ length: 40 }, (_, index) => ({
        ...deck,
        id: `layout-${index}`,
        name: `Deck ${String(index + 1).padStart(2, "0")}`,
      })),
    };
  return configuration;
}

function prepareExternalIO(variant: string, params: URLSearchParams) {
  if (variant === "import-all-diagnostics")
    deckImportStore.setState({
      status: "idle",
      source: {
        kind: "selected",
        preparedImport: undefined,
        preview: {
          deckName: "ユーザー入力.csv",
          analysis: {
            rows: [],
            skippedRows: [],
            invalidCount: 5,
            issues: [
              { diagnostic: { kind: "duplicate", uniqueKey: "自作キー" }, context: "ユーザー入力" },
              { diagnostic: { kind: "columns", count: 2 } },
              { diagnostic: { kind: "empty" } },
              { diagnostic: { kind: "parser", type: "Quotes", code: "InvalidQuotes" } },
              { diagnostic: { kind: "parser", type: "private diagnostic", code: "private diagnostic" } },
            ],
          },
        },
      },
    });
  pending = undefined;
  if (variant === "checking") io.createDeck = () => new Promise(() => undefined);
  if (variant === "bootstrap-failure") {
    const save = io.createDeck;
    let first = true;
    io.createDeck = (...args) => {
      if (first) {
        first = false;
        return Promise.reject(new Error("Network unavailable"));
      }
      return save(...args);
    };
  }
  if (variant === "create-failure") io.createDeck = () => Promise.reject(new Error("Storage unavailable"));
  if (variant === "edit-failure") io.editDeck = () => Promise.reject(new Error("Storage unavailable"));
  if (variant === "pending-edit-delete" || variant === "pending-list-delete") {
    pending = Promise.withResolvers<void>();
    const wait = pending.promise;
    const save = io.deleteDeck;
    io.deleteDeck = async (...args) => {
      await wait;
      if (variant === "pending-list-delete") throw new Error("Unavailable");
      await save(...args);
    };
  }
  if (variant.startsWith("continue-")) {
    pending = Promise.withResolvers<void>();
    const wait = pending.promise;
    const save = io.touchStudySession;
    let first = true;
    io.touchStudySession = async (...args) => {
      if (first) {
        first = false;
        await wait;
        if (variant === "continue-failure") throw new Error("Unavailable");
      }
      await save(...args);
    };
  }
  if (variant === "cleanup-failure") io.abandonStudySession = () => Promise.reject(new Error("Unavailable"));
  if (variant === "import-pending-confirmation") {
    pending = Promise.withResolvers<void>();
    const wait = pending.promise;
    const save = io.createDeck;
    io.createDeck = async (...args) => {
      await wait;
      await save(...args);
    };
  }
  if (variant === "import-pending-selection")
    deckImportStore.setState({ status: "importing", source: { kind: "empty" } });
  if (variant === "import-read-failure" || variant === "import-read-once") {
    const read = File.prototype.arrayBuffer;
    File.prototype.arrayBuffer = () => {
      if (variant === "import-read-once") File.prototype.arrayBuffer = read;
      return Promise.reject(
        variant === "import-read-once" ? new Error("file read failed") : failure(params.get("failure") ?? "unknown")
      );
    };
  }
  if (variant === "import-unknown-diagnostic")
    deckImportStore.setState({
      status: "idle",
      source: {
        kind: "selected",
        preview: {
          deckName: "ユーザー入力.csv",
          analysis: {
            rows: [],
            skippedRows: [],
            invalidCount: 1,
            issues: [
              {
                diagnostic: { kind: "parser", type: "private diagnostic", code: "private diagnostic" },
                context: "ユーザー入力",
              },
            ],
          },
        },
        preparedImport: undefined,
      },
    });
}

export default function decks(params: URLSearchParams) {
  const variant = params.get("variant") ?? "list";
  const language = params.get("language") ?? "en";
  const configuration: AppParameters = {
    ...state,
    preferences: { ...state.preferences, language: language === "ja" ? "ja" : language === "system" ? "system" : "en" },
  };
  if (params.get("account") === "linked")
    configuration.auth = { status: "authenticated", uid, isAnonymous: false, displayName: "Playwright user" };
  let path = "/";
  if (variant.startsWith("create")) path = "/deck/new";
  if (variant.startsWith("edit") || variant === "pending-edit-delete") path = `/deck/${deck.id}/edit`;
  if (variant.startsWith("import")) path = "/import";
  prepareApp(prepareListState(prepareReviewState(configuration, variant), variant));
  prepareExternalIO(variant, params);
  return renderRoutes(path);
}
