import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/shared/firebase", () => ({ db: "db" }));
vi.mock("./card", () => ({ startCardSynchronization: () => vi.fn() }));
vi.mock("./deck", () => ({ subscribeDecks: () => vi.fn() }));

import { RemoteReadProvider } from "@/app/providers/remote-read";
import { replaceAuthSession } from "@/entities/auth";
import { clearCards, replaceCards, useCards } from "@/entities/card";
import { createCard } from "@/test/factories";
import { startRemoteReadSession } from "./lifecycle";

const authenticate = (uid: string) =>
  replaceAuthSession({ status: "authenticated", uid, isAnonymous: true, displayName: null });

const CardConsumer = ({ onRender }: { onRender?: (frontTexts: string[]) => void }) => {
  const cards = useCards();
  const frontTexts = cards.map(({ frontText }) => frontText);
  onRender?.(frontTexts);
  return frontTexts.map((frontText) => <div key={frontText}>{frontText}</div>);
};

describe("RemoteReadProvider", () => {
  beforeEach(() => {
    replaceAuthSession({ status: "initializing" });
    clearCards();
  });

  it("renders without waiting for a remote snapshot", () => {
    authenticate("uid-a");

    render(
      <RemoteReadProvider>
        <div>content</div>
      </RemoteReadProvider>
    );

    expect(screen.getByText("content")).toBeTruthy();
  });

  it("does not render the previous UID's Cards after a session transition", () => {
    const stopRemoteReadSession = startRemoteReadSession();
    authenticate("uid-a");
    const renderedCards: string[][] = [];
    const card = createCard({ id: "card-a", uid: "uid-a", frontText: "Previous user Card" });
    const { unmount } = render(
      <RemoteReadProvider>
        <CardConsumer onRender={(frontTexts) => renderedCards.push(frontTexts)} />
      </RemoteReadProvider>
    );
    act(() => replaceCards([card]));
    expect(screen.getByText(card.frontText)).toBeTruthy();
    renderedCards.length = 0;

    act(() => authenticate("uid-b"));

    expect(screen.queryByText(card.frontText)).toBeNull();
    expect(renderedCards.flat()).not.toContain(card.frontText);
    unmount();
    stopRemoteReadSession();
  });
});
