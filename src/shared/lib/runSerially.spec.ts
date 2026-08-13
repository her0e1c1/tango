import { describe, expect, it, vi } from "vitest";

import { runSerially } from "@/shared/lib/runSerially";

describe("runSerially", () => {
  it("runs tasks with the same key in order", async () => {
    let finishFirst!: () => void;
    const first = runSerially(
      "key",
      () =>
        new Promise<void>((resolve) => {
          finishFirst = resolve;
        })
    );
    const secondTask = vi.fn(async () => undefined);
    const second = runSerially("key", secondTask);

    expect(secondTask).not.toHaveBeenCalled();
    finishFirst();
    await Promise.all([first, second]);

    expect(secondTask).toHaveBeenCalledOnce();
  });

  it("runs tasks with different keys concurrently", async () => {
    let finishFirst!: () => void;
    const first = runSerially(
      "first",
      () =>
        new Promise<void>((resolve) => {
          finishFirst = resolve;
        })
    );
    const secondTask = vi.fn(async () => undefined);

    await runSerially("second", secondTask);

    expect(secondTask).toHaveBeenCalledOnce();
    finishFirst();
    await first;
  });

  it("continues after a task fails", async () => {
    const failure = new Error("failed");
    const failed = runSerially("key", async () => {
      throw failure;
    });
    const nextTask = vi.fn(async () => "completed");
    const next = runSerially("key", nextTask);

    await expect(failed).rejects.toBe(failure);
    await expect(next).resolves.toBe("completed");
    expect(nextTask).toHaveBeenCalledOnce();
  });

  it("cleans up an idle key", async () => {
    await runSerially("key", async () => undefined);
    const nextTask = vi.fn(async () => undefined);

    const next = runSerially("key", nextTask);

    expect(nextTask).toHaveBeenCalledOnce();
    await next;
  });
});
