interface FirestoreQuery {
  collectionName: "card" | "deck" | "studySession";
  uid: string;
}

interface FirestoreSnapshot {
  docs: { id: string; data: () => Record<string, unknown> }[];
  docChanges?: () => {
    type: string;
    doc: { id: string; data: () => Record<string, unknown>; metadata: { hasPendingWrites: boolean } };
  }[];
  metadata: { fromCache: boolean; hasPendingWrites: boolean };
}

import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { clearRemoteCards, useCards } from "@/entities/card";
import { clearRemoteDecks, useDecks } from "@/entities/deck";

vi.mock("@/shared/firebase", () => ({
  auth: { currentUser: null },
  db: { app: { options: { projectId: "unit-app" } } },
}));
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
      _options: unknown,
      publishSnapshot: (snapshot: FirestoreSnapshot) => void
    ) => {
      if (request.collectionName === "studySession") {
        publishSnapshot({ docs: [], metadata: { fromCache: true, hasPendingWrites: false } });
        return () => undefined;
      }
      const deckId = `deck-${request.uid}`;
      const document =
        request.collectionName === "deck"
          ? {
              id: deckId,
              data: () => ({
                name: `Deck for ${request.uid}`,
                isPublic: false,
                uid: request.uid,
                createdAt: 1,
                updatedAt: actual.Timestamp.fromMillis(2),
                fsrs: null,
                deletedAt: null,
                difficultyMax: null,
                difficultyMin: null,
                studyFilter: { selectedTags: [], tagAndFilter: false },
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
                updatedAt: actual.Timestamp.fromMillis(2),
                fsrs: null,
                deletedAt: null,
                difficulty: 5,
                numberOfSeen: 0,
              }),
            };
      publishSnapshot({
        docs: [document],
        docChanges: () => [{ type: "added", doc: { ...document, metadata: { hasPendingWrites: false } } }],
        metadata: { fromCache: false, hasPendingWrites: false },
      });
      return () => undefined;
    },
  };
});

import { startFirestoreSubscriptions } from ".";

const RepositoryView = () => {
  const cards = useCards();
  const decks = useDecks();
  return (
    <>
      <p>{decks.map((deck) => deck.name).join(", ")}</p>
      <p>{cards.map((card) => card.frontText).join(", ")}</p>
    </>
  );
};

describe("Firestore subscriptions [PERSISTENCE-01 PERSISTENCE-04 ACCOUNT-03]", () => {
  beforeEach(() => {
    // Given: Establish the shared setup used by the following cases.
    clearRemoteCards();
    clearRemoteDecks();
  });
  it.each(["anonymous-uid", "linked-uid"])("publishes confirmed data for %s and clears it on cleanup", async (uid) => {
    // Given: Use this case's inputs and any shared test setup.
    const { stop } = startFirestoreSubscriptions(uid);
    // When: Exercise `render` with the prepared inputs.
    render(<RepositoryView />);
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByText(`Deck for ${uid}`)).toBeVisible();
    expect(await screen.findByText(`Front for ${uid}`)).toBeVisible();
    // When: Exercise `act` with the prepared inputs.
    act(() => stop());
    // Then: Verify the expected result in the assertions below.
    expect(screen.queryByText(`Deck for ${uid}`)).not.toBeInTheDocument();
    expect(screen.queryByText(`Front for ${uid}`)).not.toBeInTheDocument();
  });
  it("replaces the visible UID after stopping the old subscriptions", async () => {
    // Given: Prepare `stopSecond` and any shared test state below.
    const { stop: stopFirst } = startFirestoreSubscriptions("first");
    render(<RepositoryView />);
    act(() => stopFirst());
    let stopSecond: () => void = () => undefined;
    // When: Exercise `act` with the prepared inputs.
    act(() => {
      stopSecond = startFirestoreSubscriptions("second").stop;
    });
    // Then: Verify the expected result in the assertions below.
    expect(screen.queryByText("Deck for first")).not.toBeInTheDocument();
    expect(await screen.findByText("Deck for second")).toBeVisible();
    // When: Exercise `act` with the prepared inputs.
    act(() => stopSecond());
  });
});
