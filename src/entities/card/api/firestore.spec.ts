import { describe, expect, it, vi } from "vitest";

import { createCard as createCardFixture } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  doc: vi.fn((...parts: unknown[]) => parts),
  setDoc: vi.fn(),
}));

vi.mock("firebase/firestore", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase/firestore")>();
  return { ...actual, doc: mocks.doc, setDoc: mocks.setDoc };
});
vi.mock("@/shared/firebase", () => ({ db: {} }));
vi.mock("@/shared/lib/currentTime", () => ({ getCurrentTimeMillis: () => 10 }));

import { createCard, deleteCard, editCard } from "./firestore";

describe("Card Firestore persistence", () => {
  const card = createCardFixture({ id: "card", uid: "uid-a" });

  it("persists initial StudyProgress fields without adding them to Card", async () => {
    await createCard("uid-a", card);

    expect(card).not.toHaveProperty("score");
    expect(mocks.setDoc).toHaveBeenCalledWith(
      [{}, "card", card.id],
      expect.objectContaining({ id: card.id, score: 0, numberOfSeen: 0, createdAt: 10, updatedAt: 10 })
    );
  });

  it("rejects create requests without a confirmed matching owner", async () => {
    await expect(createCard("", card)).rejects.toThrow("confirmed user");
    await expect(createCard("uid-b", card)).rejects.toThrow("owner does not match");
  });

  it("rejects edit requests without a confirmed matching owner", async () => {
    await expect(editCard("", card)).rejects.toThrow("confirmed user");
    await expect(editCard("uid-b", card)).rejects.toThrow("owner does not match");
  });

  it("rejects delete requests without a confirmed matching owner", async () => {
    await expect(deleteCard("", card)).rejects.toThrow("confirmed user");
    await expect(deleteCard("uid-b", card)).rejects.toThrow("owner does not match");
  });
});
