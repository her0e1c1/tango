/**
 * @file Verifies the "Firebase Hosting cache policy" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "revalidates app routes
 * while caching fingerprinted assets".
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

interface HostingHeaderRule {
  source: string;
  headers: Array<{ key: string; value: string }>;
}

interface FirebaseConfig {
  hosting: { headers?: HostingHeaderRule[] };
}

const firebaseConfig = JSON.parse(readFileSync(path.resolve(process.cwd(), "firebase.json"), "utf8")) as FirebaseConfig;

describe("Firebase Hosting cache policy", () => {
  it("revalidates app routes while caching fingerprinted assets", () => {
    expect(firebaseConfig.hosting.headers).toEqual([
      {
        source: "**",
        headers: [{ key: "Cache-Control", value: "no-cache" }],
      },
      {
        source: "/assets/**",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ]);
  });
});
