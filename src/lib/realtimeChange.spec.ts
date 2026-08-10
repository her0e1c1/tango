/**
 * @file Verifies the "applyRealtimeChange" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "inserts added items",
 * "updates modified items", "deletes removed items".
 */

import { expect, it, describe } from "vitest";
import { applyRealtimeChange } from "@/lib/realtimeChange";

describe("applyRealtimeChange", () => {
  type Item = { id: string; name: string };

  const initial: Record<string, Item | undefined> = {
    a: { id: "a", name: "alpha" },
    b: { id: "b", name: "beta" },
  };

  it("inserts added items", () => {
    const event = { added: [{ id: "c", name: "gamma" }] };
    const result = applyRealtimeChange(initial, event);
    expect(result.c).toEqual({ id: "c", name: "gamma" });
    expect(result.a).toEqual(initial.a);
    expect(result.b).toEqual(initial.b);
  });

  it("updates modified items", () => {
    const event = { modified: [{ id: "a", name: "updated" }] };
    const result = applyRealtimeChange(initial, event);
    expect(result.a).toEqual({ id: "a", name: "updated" });
    expect(result.b).toEqual(initial.b);
  });

  it("deletes removed items", () => {
    const event = { removed: ["b"] };
    const result = applyRealtimeChange(initial, event);
    expect("b" in result).toBe(false);
    expect(result.a).toEqual(initial.a);
  });

  it("handles all three change types in one event", () => {
    const event = {
      added: [{ id: "c", name: "gamma" }],
      modified: [{ id: "a", name: "updated" }],
      removed: ["b"],
    };
    const result = applyRealtimeChange(initial, event);
    expect(result.a).toEqual({ id: "a", name: "updated" });
    expect("b" in result).toBe(false);
    expect(result.c).toEqual({ id: "c", name: "gamma" });
  });

  it("does not mutate the original byId map", () => {
    const event = { added: [{ id: "c", name: "gamma" }] };
    const copy = { ...initial };
    applyRealtimeChange(initial, event);
    expect(initial).toEqual(copy);
  });

  it("handles empty event without changes", () => {
    const result = applyRealtimeChange(initial, {});
    expect(result).toEqual(initial);
  });

  it("handles empty initial state with added items", () => {
    const result = applyRealtimeChange({}, { added: [{ id: "x", name: "x" }] });
    expect(result.x).toEqual({ id: "x", name: "x" });
  });
});
