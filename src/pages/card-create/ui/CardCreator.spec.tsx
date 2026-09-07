import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { CATEGORY, createDeck } from "@/entities/deck";
import { dismissToast, ToastViewport } from "@/shared/ui/toast";
import { createLocalDeck } from "@/test/factories";

const writes = vi.hoisted(() => ({
  createCard: vi.fn<typeof import("@/entities/card").createCard>(),
}));
const validation = vi.hoisted(() => ({ ready: undefined as Promise<void> | undefined }));

vi.mock("@/entities/auth", () => ({ useAuthUid: () => "user-id" }));
vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));
vi.mock("@/entities/card", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/entities/card")>();
  return {
    ...original,
    createCard: writes.createCard,
    // Hold real schema validation so additional clicks can occur before the resolver finishes.
    cardContentInputSchema: original.cardContentInputSchema.superRefine(async () => {
      if (validation.ready !== undefined) await validation.ready;
    }),
  };
});

import { useCardCreatePageModel } from "../model/useCardCreatePageModel";
import { CardCreator } from "./CardCreator";

const deck = createLocalDeck({ id: "target-deck", name: "Target deck" });
const savedCards: { uid: string; card: Parameters<typeof writes.createCard>[1] }[] = [];

const CardCreatorHarness = () => {
  const { form, submit } = useCardCreatePageModel(deck.id);
  return (
    <>
      <CardCreator
        categories={CATEGORY}
        deckName={deck.name}
        form={form}
        onCancel={vi.fn()}
        onSubmit={async (values) => {
          await submit(values);
        }}
      />
      <ToastViewport />
    </>
  );
};

const enterRequiredValues = async () => {
  await userEvent.type(screen.getByRole("textbox", { name: "Front text" }), "Front value");
  await userEvent.click(screen.getByRole("tab", { name: "Back" }));
  await userEvent.type(screen.getByRole("textbox", { name: "Back text" }), "Back value");
};

const deferred = () => {
  let resolve: () => void = () => undefined;
  const promise = new Promise<void>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
};

describe("CARD-13 CARD-14 CARD-15 CardCreator", () => {
  beforeEach(async () => {
    dismissToast();
    await createDeck("", deck);
    savedCards.length = 0;
    validation.ready = undefined;
    writes.createCard.mockReset();
    writes.createCard.mockImplementation((uid, card) => {
      savedCards.push({ uid, card });
      return Promise.resolve();
    });
  });

  it("saves the entered Card and shows its success notification", async () => {
    render(<CardCreatorHarness />);
    await enterRequiredValues();

    await userEvent.click(screen.getByRole("button", { name: "Create card" }));

    expect(await screen.findByText("Created card “Front value”.")).toBeVisible();
    expect(savedCards).toEqual([
      {
        uid: "user-id",
        card: {
          id: expect.any(String),
          uniqueKey: expect.any(String),
          deckId: deck.id,
          frontText: "Front value",
          backText: "Back value",
          tags: [],
        },
      },
    ]);
    expect(savedCards[0]?.card.uniqueKey).toBe(savedCards[0]?.card.id);
  });

  it("keeps both inputs after rejection and retries with a new Card identity", async () => {
    let rejectedCardId: string | undefined;
    writes.createCard.mockImplementationOnce((_uid, card) => {
      rejectedCardId = card.id;
      return Promise.reject(new Error("write rejected"));
    });
    render(<CardCreatorHarness />);
    await enterRequiredValues();

    await userEvent.click(screen.getByRole("button", { name: "Create card" }));

    expect(await screen.findByText("Unable to create this card. Try again.")).toBeVisible();
    expect(savedCards).toEqual([]);
    expect(screen.getByRole("textbox", { name: "Back text" })).toHaveValue("Back value");
    await userEvent.click(screen.getByRole("tab", { name: "Front" }));
    expect(screen.getByRole("textbox", { name: "Front text" })).toHaveValue("Front value");

    await userEvent.click(screen.getByRole("button", { name: "Create card" }));

    expect(await screen.findByText("Created card “Front value”.")).toBeVisible();
    expect(screen.queryByText("Unable to create this card. Try again.")).not.toBeInTheDocument();
    expect(savedCards).toHaveLength(1);
    expect(rejectedCardId).toBeDefined();
    expect(savedCards[0]?.card).toEqual({
      id: expect.any(String),
      uniqueKey: expect.any(String),
      deckId: deck.id,
      frontText: "Front value",
      backText: "Back value",
      tags: [],
    });
    expect(savedCards[0]?.card.id).not.toBe(rejectedCardId);
    expect(savedCards[0]?.card.uniqueKey).toBe(savedCards[0]?.card.id);
  });

  it("saves one Card for immediately repeated clicks", async () => {
    const write = deferred();
    writes.createCard.mockImplementation(async (uid, card) => {
      await write.promise;
      savedCards.push({ uid, card });
    });
    render(<CardCreatorHarness />);
    await enterRequiredValues();
    const createButton = screen.getByRole("button", { name: "Create card" });

    fireEvent.click(createButton);
    fireEvent.click(createButton);

    expect(screen.getByRole("button", { name: "Creating…" })).toBeDisabled();
    act(() => write.resolve());

    await waitFor(() => expect(screen.getByRole("button", { name: "Create card" })).toBeEnabled());
    expect(savedCards).toHaveLength(1);
  });

  it("disables repeated clicks while asynchronous validation is pending", async () => {
    const ready = deferred();
    validation.ready = ready.promise;
    render(<CardCreatorHarness />);
    await enterRequiredValues();

    await userEvent.dblClick(screen.getByRole("button", { name: "Create card" }));

    expect(screen.getByRole("button", { name: "Creating…" })).toBeDisabled();
    expect(savedCards).toEqual([]);
    act(() => ready.resolve());

    await waitFor(() => expect(screen.getByRole("button", { name: "Create card" })).toBeEnabled());
    expect(savedCards).toHaveLength(1);
  });

  it("disables repeated clicks until the pending save finishes", async () => {
    const write = deferred();
    writes.createCard.mockImplementation(async (uid, card) => {
      await write.promise;
      savedCards.push({ uid, card });
    });
    render(<CardCreatorHarness />);
    await enterRequiredValues();
    await userEvent.click(screen.getByRole("button", { name: "Create card" }));

    const createButton = screen.getByRole("button", { name: "Creating…" });
    expect(createButton).toBeDisabled();
    await userEvent.dblClick(createButton);

    expect(savedCards).toEqual([]);
    act(() => write.resolve());

    await waitFor(() => expect(screen.getByRole("button", { name: "Create card" })).toBeEnabled());
    expect(savedCards).toHaveLength(1);
  });
});
