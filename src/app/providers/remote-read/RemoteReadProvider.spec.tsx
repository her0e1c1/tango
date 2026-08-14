import { act, render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

vi.mock("@/shared/firebase", () => ({ db: "db" }));
vi.mock("./card", () => ({
  startCardSynchronization: vi.fn(() => vi.fn()),
}));
vi.mock("./deck", () => ({
  subscribeDecks: vi.fn(() => vi.fn()),
}));

import { replaceAuthSession } from "@/entities/auth";
import { clearCards, replaceCards, useCards } from "@/entities/card";
import { createCard } from "@/test/factories";
import { RemoteReadProvider } from "./RemoteReadProvider";

beforeEach(() => {
  replaceAuthSession({ status: "initializing" });
  clearCards();
});

it("renders children without waiting for a remote snapshot", () => {
  render(
    <RemoteReadProvider>
      <div>content</div>
    </RemoteReadProvider>
  );

  expect(screen.getByText("content")).toBeTruthy();
});

it("does not render the previous user's Cards during a UID switch", () => {
  const renderedCards: string[][] = [];
  const CardConsumer = () => {
    const cards = useCards();
    renderedCards.push(cards.map(({ frontText }) => frontText));
    return null;
  };
  render(
    <RemoteReadProvider>
      <CardConsumer />
    </RemoteReadProvider>
  );
  act(() =>
    replaceAuthSession({
      status: "authenticated",
      uid: "uid-a",
      isAnonymous: true,
      displayName: null,
    })
  );
  act(() => replaceCards([createCard({ uid: "uid-a", frontText: "Previous user Card" })]));
  renderedCards.length = 0;

  act(() =>
    replaceAuthSession({
      status: "authenticated",
      uid: "uid-b",
      isAnonymous: true,
      displayName: null,
    })
  );

  expect(renderedCards.flat()).not.toContain("Previous user Card");
});
