import { describe, expect, it, vi } from "vitest";

import { runSerially } from "@/shared/lib/runSerially";

describe("runSerially", () => {
  it("runs tasks with the same key in order", async () => {
    let finishFirst!: () => void;
    const first = runSerially(
      "order",
      () =>
        new Promise<void>((resolve) => {
          finishFirst = resolve;
        })
    );
    const secondTask = vi.fn(async () => undefined);
    const second = runSerially("order", secondTask);

    expect(secondTask).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(finishFirst).toBeTypeOf("function"));
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
    const failed = runSerially("failure", async () => {
      throw failure;
    });
    const nextTask = vi.fn(async () => "completed");
    const next = runSerially("failure", nextTask);

    await expect(failed).rejects.toBe(failure);
    await expect(next).resolves.toBe("completed");
    expect(nextTask).toHaveBeenCalledOnce();
  });

  it("serializes a task enqueued from a running task", async () => {
    let nested!: Promise<void>;
    let outerRunning = false;
    const nestedTask = vi.fn(async () => {
      expect(outerRunning).toBe(false);
    });
    const outer = runSerially("reentrant", async () => {
      outerRunning = true;
      nested = runSerially("reentrant", nestedTask);

      await Promise.resolve();
      expect(nestedTask).not.toHaveBeenCalled();
      outerRunning = false;
    });

    await outer;
    await nested;

    expect(nestedTask).toHaveBeenCalledOnce();
  });

  it("cleans up an idle key", async () => {
    await runSerially("cleanup", async () => undefined);
    const nextTask = vi.fn(async () => undefined);

    await runSerially("cleanup", nextTask);

    expect(nextTask).toHaveBeenCalledOnce();
  });
});
