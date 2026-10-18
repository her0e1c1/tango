import { describe, expect, it } from "vitest";
import { z } from "zod";

import { parseFirestoreDocument } from "./firestoreDocument";

describe("Firestore document utilities [PERSISTENCE-04]", () => {
  it("parses an arbitrary collection document", () => {
    // Given: Use this case's inputs and any shared test setup.
    const schema = z.object({ title: z.string() });

    // When: Parse the supplied document against the prepared schema inside the assertion.
    // Then: Verify the parsed value or the specified validation error.
    expect(parseFirestoreDocument(schema, "note", "note-a", { title: "Hello" })).toEqual({ title: "Hello" });
  });

  it("reports validation details for an arbitrary collection", () => {
    // Given: Use this case's inputs and any shared test setup.
    const schema = z.object({ metadata: z.object({ title: z.string() }) });

    // When: Parse the supplied document against the prepared schema inside the assertion.
    // Then: Verify the parsed value or the specified validation error.
    expect(() => parseFirestoreDocument(schema, "note", "note-a", { metadata: { title: 42 } })).toThrowError(
      expect.objectContaining({
        name: "FirestoreDocumentValidationError",
        collectionName: "note",
        documentId: "note-a",
        message: expect.stringContaining('Invalid Firestore note document "note-a": metadata.title'),
        issues: [expect.objectContaining({ path: ["metadata", "title"] })],
      })
    );
    expect(() => parseFirestoreDocument(schema, "note", "note-a", {})).toThrowError(
      expect.objectContaining({ name: "FirestoreDocumentValidationError" })
    );
  });
});
