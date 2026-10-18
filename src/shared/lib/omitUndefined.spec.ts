import { describe, expect, it } from "vitest";

import { omitUndefined } from "./omitUndefined";

describe("omitUndefined", () => {
  it("omits top-level undefined fields while preserving other values", () => {
    // Given: Prepare `input` and any shared test state below.
    const input = {
      keepNull: null,
      keepString: "text",
      keepNumber: 0,
      keepBoolean: false,
      keepArray: [1, 2],
      keepNested: { nestedUndefined: undefined },
      omitThis: undefined,
    };

    // When: Evaluate `omitUndefined` as part of the following checks.
    // Then: Verify the expected result in the assertions below.
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
