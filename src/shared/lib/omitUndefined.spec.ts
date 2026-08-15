import { describe, expect, it } from "vitest";

import { omitUndefined } from "./omitUndefined";

describe("omitUndefined", () => {
  it("omits top-level undefined fields while preserving other values", () => {
    const input = {
      keepNull: null,
      keepString: "text",
      keepNumber: 0,
      keepBoolean: false,
      keepArray: [1, 2],
      keepNested: { nestedUndefined: undefined },
      omitThis: undefined,
    };

    expect(omitUndefined(input)).toEqual({
      keepNull: null,
      keepString: "text",
      keepNumber: 0,
      keepBoolean: false,
      keepArray: [1, 2],
      keepNested: { nestedUndefined: undefined },
    });
    expect(omitUndefined(input)).not.toHaveProperty("omitThis");
  });
});
