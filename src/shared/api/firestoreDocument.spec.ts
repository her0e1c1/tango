import { describe, expect, it } from "vitest";
import { z } from "zod";

import { parseFirestoreDocument } from "./firestoreDocument";

describe("Firestore document utilities [PERSISTENCE-04]", () => {
  it("parses an arbitrary collection document", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `z.object` with the prepared inputs.
    const schema = z.object({ title: z.string() });

    // Then: Verify the expected result in the assertions below.
    expect(parseFirestoreDocument(schema, "note", "note-a", { title: "Hello" })).toEqual({ title: "Hello" });
  });

  it("reports validation details for an arbitrary collection", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `z.object` with the prepared inputs.
    const schema = z.object({ metadata: z.object({ title: z.string() }) });

    // Then: Verify the expected result in the assertions below.
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
