/** @file Verifies Firebase configuration for the bounded StudyAttempt query. */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

interface FirebaseConfig {
  firestore?: {
    rules?: string;
    indexes?: string;
  };
}

interface FirestoreIndexes {
  indexes?: Array<{
    collectionGroup?: string;
    queryScope?: string;
    fields?: Array<{ fieldPath?: string; order?: string }>;
  }>;
  fieldOverrides?: unknown[];
}

describe("StudyAttempt Firebase configuration", () => {
  it("references the Rules and composite index files", () => {
    const config = JSON.parse(readFileSync("firebase.json", "utf8")) as FirebaseConfig;

    expect(config.firestore).toEqual({
      rules: "firestore.rules",
      indexes: "firestore.indexes.json",
    });
  });

  it("defines only the composite index required by the version 1 query", () => {
    const config = JSON.parse(readFileSync("firestore.indexes.json", "utf8")) as FirestoreIndexes;

    expect(config).toEqual({
      indexes: [
        {
          collectionGroup: "studyAttempt",
          queryScope: "COLLECTION",
          fields: [
            { fieldPath: "uid", order: "ASCENDING" },
            { fieldPath: "answeredAt", order: "DESCENDING" },
          ],
        },
      ],
      fieldOverrides: [],
    });
  });
});
