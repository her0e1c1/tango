import { afterEach, describe, expect, it, vi } from "vitest";
import { Timestamp } from "firebase/firestore";
import { z } from "zod";

import {
  FirestoreDocumentValidationError,
  firestoreTimestampDateSchema,
  getTimestamp,
  parseFirestoreDocument,
} from "./firestoreDocument";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Firestore document helpers", () => {
  it("parses an arbitrary collection document", () => {
    const schema = z.object({ title: z.string() });

    expect(parseFirestoreDocument(schema, "note", "note-a", { title: "Hello" })).toEqual({ title: "Hello" });
  });

  it("reports validation details for an arbitrary collection", () => {
    const schema = z.object({ title: z.string() });

    expect(() => parseFirestoreDocument(schema, "note", "note-a", { title: 42 })).toThrowError(
      expect.objectContaining({
        name: "FirestoreDocumentValidationError",
        collectionName: "note",
        documentId: "note-a",
        message: expect.stringContaining("title"),
      })
    );
    expect(() => parseFirestoreDocument(schema, "note", "note-a", {})).toThrow(FirestoreDocumentValidationError);
  });

  it("converts Firestore timestamps and preserves valid legacy dates", () => {
    const date = new Date(60);

    expect(firestoreTimestampDateSchema.parse(Timestamp.fromMillis(50))).toEqual(new Date(50));
    expect(firestoreTimestampDateSchema.parse(date)).toBe(date);
  });

  it("rejects malformed timestamp values", () => {
    const malformed = { seconds: 0, nanoseconds: 0, toDate: () => new Date(Number.NaN) };

    expect(() => firestoreTimestampDateSchema.parse(malformed)).toThrow();
  });

  it("returns the current numeric timestamp", () => {
    vi.spyOn(Date, "now").mockReturnValue(123);

    expect(getTimestamp()).toBe(123);
  });
});
