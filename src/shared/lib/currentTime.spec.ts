import { afterEach, describe, expect, it, vi } from "vitest";

import { getCurrentTimeMillis } from "./currentTime";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getCurrentTimeMillis", () => {
  it("returns the current time in milliseconds", () => {
    vi.spyOn(Date, "now").mockReturnValue(123);

    expect(getCurrentTimeMillis()).toBe(123);
  });
});
