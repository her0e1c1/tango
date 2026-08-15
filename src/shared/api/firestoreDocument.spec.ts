import { describe, expect, it } from "vitest";
import { Timestamp } from "firebase/firestore";
import { z } from "zod";

import { firestoreTimestampDateSchema, parseFirestoreDocument } from "./firestoreDocument";

describe("Firestore document utilities", () => {
  it("parses an arbitrary collection document", () => {
    const schema = z.object({ title: z.string() });

    expect(parseFirestoreDocument(schema, "note", "note-a", { title: "Hello" })).toEqual({ title: "Hello" });
  });

  it("reports validation details for an arbitrary collection", () => {
    const schema = z.object({ metadata: z.object({ title: z.string() }) });

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

  it("converts Firestore timestamps and preserves valid legacy dates", () => {
    const date = new Date(60);

    expect(firestoreTimestampDateSchema.parse(Timestamp.fromMillis(50))).toEqual(new Date(50));
    expect(firestoreTimestampDateSchema.parse(date)).toBe(date);
  });

  it.each([
    new Date(Number.NaN),
    { seconds: 0, nanoseconds: 0, toDate: () => new Date(Number.NaN) },
    { seconds: 0, nanoseconds: 0, toDate: () => "not a date" },
    { seconds: 0, nanoseconds: 1_000_000_000, toDate: () => new Date(0) },
    {
      get seconds(): number {
        throw new Error("malformed");
      },
      nanoseconds: 0,
      toDate: () => new Date(0),
    },
    {
      seconds: 0,
      nanoseconds: 0,
      toDate: () => {
        throw new Error("malformed");
      },
    },
  ])("rejects malformed dates and timestamps through the schema boundary", (value) => {
    expect(firestoreTimestampDateSchema.safeParse(value).success).toBe(false);
  });
});
