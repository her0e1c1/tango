import { afterEach, describe, expect, it, vi } from "vitest";
import { Timestamp } from "firebase/firestore";
import { z } from "zod";

import { firestoreTimestampDateSchema, getTimestamp, omitUndefined, parseFirestoreDocument } from "./firestoreDocument";

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
    expect(() => parseFirestoreDocument(schema, "note", "note-a", {})).toThrowError(
      expect.objectContaining({ name: "FirestoreDocumentValidationError" })
    );
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

  it("omits undefined fields while preserving null and concrete values", () => {
    const input = {
      keepNull: null,
      keepString: "text",
      keepNumber: 0,
      keepBoolean: false,
      keepArray: [1, 2],
      omitThis: undefined,
    };

    expect(omitUndefined(input)).toEqual({
      keepNull: null,
      keepString: "text",
      keepNumber: 0,
      keepBoolean: false,
      keepArray: [1, 2],
    });
    expect(omitUndefined(input)).not.toHaveProperty("omitThis");
  });
});
