import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { mutateCards } from "@/entities/card";
import { createDeck } from "@/entities/deck";
import { actAsync } from "@/test/act";
import { createLocalCard, createLocalDeck } from "@/test/factories";
import { RouteEntityBoundary } from "./RouteEntityBoundary";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

describe("RouteEntityBoundary", () => {
  it("mounts Deck route content when the Deck becomes available", async () => {
    const deckId = "delayed-route-deck";
    render(
      <MemoryRouter>
        <RouteEntityBoundary entity="Deck" id={deckId}>
          <h1>Deck content</h1>
        </RouteEntityBoundary>
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "Deck not found" })).toBeVisible();
    await actAsync(async () => {
      await createDeck("", createLocalDeck({ id: deckId }));
    });
    expect(screen.getByRole("heading", { name: "Deck content" })).toBeVisible();
  });

  it("mounts Card route content only after its Card and parent Deck exist", async () => {
    const deckId = "card-route-deck";
    const cardId = "delayed-route-card";
    render(
      <MemoryRouter>
        <RouteEntityBoundary entity="Card" id={cardId}>
          <h1>Card content</h1>
        </RouteEntityBoundary>
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "Card not found" })).toBeVisible();
    await actAsync(async () => {
      await createDeck("", createLocalDeck({ id: deckId }));
      await mutateCards("", [{ kind: "create", card: createLocalCard({ id: cardId, deckId }) }]);
    });
    expect(screen.getByRole("heading", { name: "Card content" })).toBeVisible();
  });
});
