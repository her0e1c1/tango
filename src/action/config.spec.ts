import { expect, it, describe, vi, beforeEach } from "vitest";

import * as type from "./type";
import { update } from "./config";

vi.mock("firebase/auth");
vi.mock("firebase/firestore");

describe("config action", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.resetModules();
  });

  it("should update", async () => {
    const dispatch = vi.fn();
    const getState = vi.fn();
    const f = update("autoPlay", true); // TODO: test other fields
    await f(dispatch, getState, undefined);
    expect(dispatch).lastCalledWith(type.configUpdate({ autoPlay: true }));
  });
});
