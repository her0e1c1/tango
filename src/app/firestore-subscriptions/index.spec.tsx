interface FirestoreQuery {
  collectionName: "card" | "deck" | "studySession";
  uid: string;
}

interface FirestoreSnapshot {
  docs: { id: string; data: () => Record<string, unknown> }[];
}

import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

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
    onSnapshot: (request: FirestoreQuery, publishSnapshot: (snapshot: FirestoreSnapshot) => void) => {
      if (request.collectionName === "studySession") {
        publishSnapshot({ docs: [] });
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
    clearRemoteCards();
    clearRemoteDecks();
  });
  it.each(["anonymous-uid", "linked-uid"])("publishes cached data for %s and clears it on cleanup", (uid) => {
    const { stop } = startFirestoreSubscriptions(uid);
    render(<RepositoryView />);
    expect(screen.getByText(`Deck for ${uid}`)).toBeVisible();
    expect(screen.getByText(`Front for ${uid}`)).toBeVisible();
    act(() => stop());
    expect(screen.queryByText(`Deck for ${uid}`)).not.toBeInTheDocument();
    expect(screen.queryByText(`Front for ${uid}`)).not.toBeInTheDocument();
  });
  it("replaces the visible UID after stopping the old subscriptions", () => {
    const { stop: stopFirst } = startFirestoreSubscriptions("first");
    render(<RepositoryView />);
    act(() => stopFirst());
    let stopSecond: () => void = () => undefined;
    act(() => {
      stopSecond = startFirestoreSubscriptions("second").stop;
    });
    expect(screen.queryByText("Deck for first")).not.toBeInTheDocument();
    expect(screen.getByText("Deck for second")).toBeVisible();
    act(() => stopSecond());
  });
});
