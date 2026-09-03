interface FirestoreQuery {
  collectionName: "card" | "deck";
  uid: string;
}

interface FirestoreSnapshot {
  docs: { id: string; data: () => Record<string, unknown> }[];
}

import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { replaceAuthSession } from "@/entities/auth";
import { clearRemoteCards, useCards } from "@/entities/card";
import { clearRemoteDecks, useDecks } from "@/entities/deck";

vi.mock("@/shared/firebase", () => ({ db: {} }));
vi.mock("firebase/firestore", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase/firestore")>();
  return {
    ...actual,
    collection: (_database: unknown, collectionName: FirestoreQuery["collectionName"]) => ({ collectionName }),
    where: (_field: string, _operator: string, uid: string) => ({ uid }),
    query: (collectionReference: Pick<FirestoreQuery, "collectionName">, filter: Pick<FirestoreQuery, "uid">) => ({
      ...collectionReference,
      ...filter,
    }),
    onSnapshot: (
      request: FirestoreQuery,
      publishSnapshot: (snapshot: FirestoreSnapshot) => void,
      _onError: (error: Error) => void
    ) => {
      const deckId = `deck-${request.uid}`;
      const document =
        request.collectionName === "deck"
          ? {
              id: deckId,
              data: () => ({
                name: `Deck for ${request.uid}`,
                uid: request.uid,
                createdAt: 1,
                updatedAt: 2,
                deletedAt: null,
                difficultyMax: null,
                difficultyMin: null,
                selectedTags: [],
                tagAndFilter: false,
                category: "",
                convertToBr: false,
              }),
            }
          : {
              id: `card-${request.uid}`,
              data: () => ({
                frontText: `Front for ${request.uid}`,
                backText: `Back for ${request.uid}`,
                tags: [],
                uniqueKey: `key-${request.uid}`,
                deckId,
                uid: request.uid,
                createdAt: 1,
                updatedAt: 2,
                deletedAt: null,
                difficulty: 5,
                numberOfSeen: 0,
              }),
            };
      publishSnapshot({ docs: [document] });
      return () => undefined;
    },
  };
});

import { FirestoreSubscriptionsProvider } from ".";

const authenticatedSession = (uid: string) => ({
  status: "authenticated" as const,
  uid,
  isAnonymous: true,
  displayName: null,
});

const RepositoryView = () => {
  const cards = useCards();
  const decks = useDecks();
  return (
    <>
      <p>{decks.length === 0 ? "No remote Decks" : decks.map((deck) => deck.name).join(", ")}</p>
      <p>{cards.length === 0 ? "No remote Cards" : cards.map((card) => card.frontText).join(", ")}</p>
    </>
  );
};

const renderProvider = () =>
  render(
    <FirestoreSubscriptionsProvider>
      <p>Application content</p>
      <RepositoryView />
    </FirestoreSubscriptionsProvider>
  );

describe("FirestoreSubscriptionsProvider [CARD-01]", () => {
  beforeEach(() => {
    clearRemoteCards();
    clearRemoteDecks();
    replaceAuthSession({ status: "initializing" });
  });

  it("leaves application content available without remote data before authentication", () => {
    renderProvider();

    expect(screen.getByText("Application content")).toBeVisible();
    expect(screen.getByText("No remote Decks")).toBeVisible();
    expect(screen.getByText("No remote Cards")).toBeVisible();
  });

  it("shows remote data for the authenticated identity", () => {
    act(() => replaceAuthSession(authenticatedSession("user-a")));

    renderProvider();

    expect(screen.getByText("Deck for user-a")).toBeVisible();
    expect(screen.getByText("Front for user-a")).toBeVisible();
  });

  it("replaces visible remote data when the authenticated identity changes", () => {
    act(() => replaceAuthSession(authenticatedSession("user-a")));
    renderProvider();
    expect(screen.getByText("Deck for user-a")).toBeVisible();

    act(() => replaceAuthSession(authenticatedSession("user-b")));

    expect(screen.getByText("Deck for user-b")).toBeVisible();
    expect(screen.getByText("Front for user-b")).toBeVisible();
    expect(screen.queryByText("Deck for user-a")).not.toBeInTheDocument();
    expect(screen.queryByText("Front for user-a")).not.toBeInTheDocument();
  });

  it("clears visible remote data on logout while preserving application content", () => {
    act(() => replaceAuthSession(authenticatedSession("user-a")));
    renderProvider();
    expect(screen.getByText("Deck for user-a")).toBeVisible();

    act(() => replaceAuthSession({ status: "unauthenticated" }));

    expect(screen.getByText("Application content")).toBeVisible();
    expect(screen.getByText("No remote Decks")).toBeVisible();
    expect(screen.getByText("No remote Cards")).toBeVisible();
  });

  it("clears remote data when the provider unmounts", () => {
    act(() => replaceAuthSession(authenticatedSession("user-a")));
    const view = renderProvider();
    expect(screen.getByText("Deck for user-a")).toBeVisible();

    view.unmount();
    render(<RepositoryView />);

    expect(screen.getByText("No remote Decks")).toBeVisible();
    expect(screen.getByText("No remote Cards")).toBeVisible();
  });
});
