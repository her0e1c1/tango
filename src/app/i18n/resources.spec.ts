import { describe, expect, it } from "vitest";

import { resources } from "./resources";

const leafPaths = (value: object, prefix = ""): string[] =>
  Object.entries(value).flatMap(([key, child]) => {
    const path = prefix === "" ? key : `${prefix}.${key}`;
    return typeof child === "string" ? [path] : leafPaths(child as object, path);
  });

describe("SETTINGS-04 SETTINGS-05 translation resources", () => {
  it("keeps English and Japanese translation keys in parity", () => {
    const comparePaths = (left: string, right: string) => left.localeCompare(right);

    expect(leafPaths(resources.ja.translation).sort(comparePaths)).toEqual(
      leafPaths(resources.en.translation).sort(comparePaths)
    );
  });
});
