import { describe, expect, it } from "vitest";

import { createCard as createCardFixture } from "@/test/factories";

import {
  cardContentInputSchema,
  cardContentSchema,
  createCardSchema,
  deleteCardSchema,
  editCardSchema,
} from "./schema";

const card = createCardFixture({ id: "card", deckId: "deck", uid: "uid-a" });

describe("Card content input schema [CARD-MANAGEMENT-05 CARD-MANAGEMENT-10]", () => {
  registerAcceptsContentWithoutAskingForAnIdentity();
  registerReportsTheRequiredFieldsWhenBothSidesAreEmpty();
});

describe("Card content schema [CARD-VIEW-01]", () => {
  registerRejectsBlankFrontTextJ();
  registerRejectsBlankBackTextJ();
  registerRejectsBlankUniqueKeysJ();
});

describe("Card operation schemas [CARD-VIEW-01]", () => {
  registerAppliesEntityDefaultsWithoutAddingPersistenceTimestamps();

  registerValidatesCreateOwnership();

  registerAppliesCardContentValidationToCreatesAndEdits();

  registerKeepsOrdinaryEditsWithinCardOwnedEditableFields();

  registerValidatesDeleteOwnershipAndReturnsOnlyCardIdentity();
});

function registerAcceptsContentWithoutAskingForAnIdentity() {
  it("accepts content without asking for an identity", () => {
    const content = { frontText: "Front", backText: "Back", tags: ["custom"] };

    expect(cardContentInputSchema.parse(content)).toEqual(content);
  });
}

function registerReportsTheRequiredFieldsWhenBothSidesAreEmpty() {
  it("reports the required fields when both sides are empty", () => {
    expect(cardContentInputSchema.safeParse({ frontText: "", backText: "", tags: [] })).toMatchObject({
      success: false,
      error: {
        issues: [
          { path: ["frontText"], message: "Front text is required." },
          { path: ["backText"], message: "Back text is required." },
        ],
      },
    });
  });
}

function registerRejectsBlankFrontTextJ() {
  it.each(["", "   ", "\n\t"])("rejects blank front text: %j", (frontText) => {
    expect(() => cardContentSchema.parse({ frontText, backText: "back", tags: [], uniqueKey: "key" })).toThrow(
      "Front text is required."
    );
  });
}

function registerRejectsBlankBackTextJ() {
  it.each(["", "   ", "\n\t"])("rejects blank back text: %j", (backText) => {
    expect(() => cardContentSchema.parse({ frontText: "front", backText, tags: [], uniqueKey: "key" })).toThrow(
      "Back text is required."
    );
  });
}

function registerRejectsBlankUniqueKeysJ() {
  it.each(["", "   ", "\n\t"])("rejects blank unique keys: %j", (uniqueKey) => {
    expect(() => cardContentSchema.parse({ frontText: "front", backText: "back", tags: [], uniqueKey })).toThrow(
      "Unique key is required."
    );
  });
}

function registerAppliesEntityDefaultsWithoutAddingPersistenceTimestamps() {
  it("applies entity defaults without adding persistence timestamps", () => {
    expect(
      createCardSchema.parse({
        uid: "uid-a",
        card: {
          id: "card",
          deckId: "deck",
          uid: "uid-a",
          frontText: "front",
          backText: "back",
          tags: ["tag"],
          uniqueKey: "key",
        },
      })
    ).toEqual({
      uid: "uid-a",
      card: {
        id: "card",
        deckId: "deck",
        uid: "uid-a",
        frontText: "front",
        backText: "back",
        tags: ["tag"],
        uniqueKey: "key",
        deletedAt: null,
      },
    });
  });
}

function registerValidatesCreateOwnership() {
  it("validates create ownership", () => {
    expect(() => createCardSchema.parse({ uid: "uid-b", card })).toThrow("owner does not match");
  });
}

function registerAppliesCardContentValidationToCreatesAndEdits() {
  it("applies Card content validation to creates and edits", () => {
    expect(() => createCardSchema.parse({ uid: "uid-a", card: { ...card, uniqueKey: " " } })).toThrow(
      "Unique key is required."
    );
    expect(() => editCardSchema.parse({ uid: "uid-a", card: { id: card.id, uid: card.uid, frontText: " " } })).toThrow(
      "Front text is required."
    );
  });
}

function registerKeepsOrdinaryEditsWithinCardOwnedEditableFields() {
  it("keeps ordinary edits within Card-owned editable fields", () => {
    expect(
      editCardSchema.parse({
        uid: "uid-a",
        card: { ...card, frontText: "Updated", deckId: "other", difficulty: 99, numberOfSeen: 99 },
      })
    ).toEqual({
      uid: "uid-a",
      card: {
        id: card.id,
        uid: card.uid,
        frontText: "Updated",
        backText: card.backText,
        tags: card.tags,
        uniqueKey: card.uniqueKey,
      },
    });
    expect(() => editCardSchema.parse({ uid: "uid-b", card })).toThrow("owner does not match");
  });
}

function registerValidatesDeleteOwnershipAndReturnsOnlyCardIdentity() {
  it("validates delete ownership and returns only Card identity", () => {
    expect(deleteCardSchema.parse({ uid: "uid-a", card })).toEqual({
      uid: "uid-a",
      card: { id: "card", uid: "uid-a" },
    });
    expect(() => deleteCardSchema.parse({ uid: "uid-b", card })).toThrow("owner does not match");
  });
}
