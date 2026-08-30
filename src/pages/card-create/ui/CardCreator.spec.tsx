import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { createDeck } from "@/entities/deck";
import { createLocalDeck } from "@/test/factories";

const writes = vi.hoisted(() => ({ createCard: vi.fn(), generateCardId: vi.fn(() => "generated-card-id") }));

vi.mock("@/entities/auth", () => ({ useAuthUid: () => "user-id" }));
vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));
vi.mock("@/entities/card", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/card")>()),
  createCard: writes.createCard,
  generateCardId: writes.generateCardId,
}));

import { useCardCreateForm } from "../model/useCardCreateForm";
import { CardCreator } from "./CardCreator";

const deck = createLocalDeck({ id: "target-deck", name: "Target deck" });

const CardCreatorHarness = ({ onCreated = vi.fn() }: { onCreated?: (cardId: string) => void }) => {
  const state = useCardCreateForm({ deck, onCreated });
  return (
    <CardCreator
      categories={state.categories}
      deckName={state.deckName}
      form={state.form}
      onCancel={vi.fn()}
      onSubmit={state.onSubmit}
      saveError={state.saveError}
    />
  );
};

const enterRequiredValues = async () => {
  await userEvent.type(screen.getByRole("textbox", { name: "Front text" }), "Front value");
  await userEvent.type(screen.getByRole("textbox", { name: "Back text" }), "Back value");
};

describe("CardCreator", () => {
  beforeEach(async () => {
    await createDeck("", deck);
    writes.createCard.mockReset();
    writes.createCard.mockResolvedValue(undefined);
    writes.generateCardId.mockClear();
  });

  it("creates a Card with one stable generated identity", async () => {
    const onCreated = vi.fn();
    render(<CardCreatorHarness onCreated={onCreated} />);
    await enterRequiredValues();

    await userEvent.click(screen.getByRole("button", { name: "Create card" }));

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith("generated-card-id"));
    expect(writes.generateCardId).toHaveBeenCalledOnce();
    expect(writes.createCard).toHaveBeenCalledWith("user-id", {
      id: "generated-card-id",
      uniqueKey: "generated-card-id",
      deckId: deck.id,
      frontText: "Front value",
      backText: "Back value",
      tags: [],
    });
  });

  it("keeps input and identity when a failed creation is retried", async () => {
    writes.createCard.mockRejectedValueOnce(new Error("write failed")).mockResolvedValueOnce(undefined);
    const onCreated = vi.fn();
    render(<CardCreatorHarness onCreated={onCreated} />);
    await enterRequiredValues();

    await userEvent.click(screen.getByRole("button", { name: "Create card" }));
    expect(await screen.findByText("Unable to create this card. Try again.")).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Front text" })).toHaveValue("Front value");

    await userEvent.click(screen.getByRole("button", { name: "Create card" }));

    await waitFor(() => expect(onCreated).toHaveBeenCalledOnce());
    expect(writes.createCard).toHaveBeenCalledTimes(2);
    expect(writes.createCard.mock.calls[0]?.[1]).toEqual(writes.createCard.mock.calls[1]?.[1]);
    expect(writes.generateCardId).toHaveBeenCalledOnce();
  });

  it("suppresses a second submit while creation is pending", async () => {
    let finishWrite: () => void = () => undefined;
    writes.createCard.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finishWrite = resolve;
        })
    );
    render(<CardCreatorHarness />);
    await enterRequiredValues();
    const createButton = screen.getByRole("button", { name: "Create card" });

    fireEvent.click(createButton);
    fireEvent.click(createButton);

    await waitFor(() => expect(writes.createCard).toHaveBeenCalledOnce());
    act(() => finishWrite());
  });

  it("does not navigate after an in-flight creation outlives the Page", async () => {
    let finishWrite: () => void = () => undefined;
    writes.createCard.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finishWrite = resolve;
        })
    );
    const onCreated = vi.fn();
    const view = render(<CardCreatorHarness onCreated={onCreated} />);
    await enterRequiredValues();
    await userEvent.click(screen.getByRole("button", { name: "Create card" }));
    view.unmount();

    await Promise.resolve(act(async () => finishWrite()));

    expect(onCreated).not.toHaveBeenCalled();
  });
});
