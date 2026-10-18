import { describe, expect, it } from "vitest";
import { z } from "zod";

import { parseFirestoreDocument } from "./firestoreDocument";

describe("Firestore document utilities [PERSISTENCE-04]", () => {
  it("parses an arbitrary collection document", () => {
    // Given: Prepare `schema` and any shared test state below.
    const schema = z.object({ title: z.string() });

    // When: Evaluate `parseFirestoreDocument` as part of the following checks.
    // Then: Verify the expected result in the assertions below.
    expect(parseFirestoreDocument(schema, "note", "note-a", { title: "Hello" })).toEqual({ title: "Hello" });
  });

  it("reports validation details for an arbitrary collection", () => {
    // Given: Prepare `schema` and any shared test state below.
    const schema = z.object({ metadata: z.object({ title: z.string() }) });

    // When: Evaluate `parseFirestoreDocument` as part of the following checks.
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
