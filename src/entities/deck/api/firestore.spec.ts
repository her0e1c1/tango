import { beforeEach, describe, expect, it, vi } from "vitest";

import { createDeck as createDeckFixture } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  deleteField: vi.fn(() => ({ type: "delete-field" })),
  doc: vi.fn((...parts: unknown[]) => parts),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
}));

vi.mock("firebase/firestore", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase/firestore")>();
  return {
    ...actual,
    deleteField: mocks.deleteField,
    doc: mocks.doc,
    setDoc: mocks.setDoc,
    updateDoc: mocks.updateDoc,
  };
});
vi.mock("@/shared/firebase", () => ({ db: {} }));

import { createDeck, deleteDeck, editDeck } from "./firestore";

describe("Deck Firestore persistence", () => {
  const deck = createDeckFixture({ id: "deck", uid: "uid-a" });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not persist localMode in a remote Deck document", async () => {
    await createDeck("uid-a", deck);

    expect(mocks.setDoc).toHaveBeenCalledWith([{}, "deck", "deck"], expect.not.objectContaining({ localMode: false }));
    expect(mocks.setDoc.mock.calls[0]?.[1]).not.toHaveProperty("localMode");
  });

  it("rejects create requests without a confirmed matching owner", async () => {
    await expect(createDeck("", deck)).rejects.toThrow("confirmed user");
    await expect(createDeck("uid-b", deck)).rejects.toThrow("owner does not match");
  });

  it("rejects edit requests without a confirmed user", async () => {
    await expect(editDeck("", { id: deck.id })).rejects.toThrow("confirmed user");
  });

  it("deletes a cleared URL while omitting an unchanged URL", async () => {
    await editDeck("uid-a", { id: deck.id });
    expect(mocks.updateDoc.mock.calls[0]?.[1]).not.toHaveProperty("url");

    await editDeck("uid-a", { id: deck.id, url: null });
    expect(mocks.deleteField).toHaveBeenCalledOnce();
    expect(mocks.updateDoc).toHaveBeenLastCalledWith(
      [{}, "deck", "deck"],
      expect.objectContaining({ url: mocks.deleteField.mock.results[0]?.value })
    );
  });

  it("rejects delete requests without a confirmed matching owner", async () => {
    await expect(deleteDeck("", deck)).rejects.toThrow("confirmed user");
    await expect(deleteDeck("uid-b", deck)).rejects.toThrow("owner does not match");
  });
});
