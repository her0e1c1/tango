/**
 * @file Verifies the "cleanupFirestoreUid" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "stops subscriptions, awaits
 * cancellation, then removes the UID cache", "removes only the selected UID query prefix",
 * "finishes cache cleanup before surfacing a listener stop error".
 */

import { QueryClient } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { stopRemoteReads } = vi.hoisted(() => ({ stopRemoteReads: vi.fn() }));

vi.mock("@/query/reads/remoteReadSession", () => ({ stopRemoteReads }));

import { cleanupFirestoreUid } from "@/query/cleanup";
import { queryClient } from "@/query/client";
import { firestoreKeys } from "@/query/cache/firestoreKeys";

describe("cleanupFirestoreUid", () => {
  const temporaryClients: QueryClient[] = [];
  const createClient = () => {
    const client = new QueryClient();
    temporaryClients.push(client);
    return client;
  };

  beforeEach(() => {
    stopRemoteReads.mockReset();
    temporaryClients.length = 0;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    queryClient.clear();
    temporaryClients.forEach((client) => {
      client.clear();
    });
  });

  it("stops subscriptions, awaits cancellation, then removes the UID cache", async () => {
    const operations: string[] = [];
    let finishCancellation: () => void = () => undefined;
    stopRemoteReads.mockImplementation(() => operations.push("stop-remote"));
    const cancelQueries = vi.spyOn(queryClient, "cancelQueries").mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          operations.push("cancel");
          finishCancellation = resolve;
        })
    );
    const removeQueries = vi.spyOn(queryClient, "removeQueries").mockImplementation(() => {
      operations.push("remove");
    });

    const cleanup = cleanupFirestoreUid("uid-a");

    expect(operations).toEqual(["stop-remote", "cancel"]);
    expect(removeQueries).not.toHaveBeenCalled();

    finishCancellation();
    await cleanup;

    const filter = { queryKey: firestoreKeys.uid("uid-a") };
    expect(operations).toEqual(["stop-remote", "cancel", "remove"]);
    expect(stopRemoteReads).toHaveBeenCalledWith("uid-a");
    expect(cancelQueries).toHaveBeenCalledWith(filter);
    expect(removeQueries).toHaveBeenCalledWith(filter);
  });

  it("removes only the selected UID query prefix", async () => {
    const client = createClient();
    client.setQueryData(firestoreKeys.decks("uid-a"), ["deck-a"]);
    client.setQueryData(firestoreKeys.cards("uid-a"), ["card-a"]);
    client.setQueryData(firestoreKeys.decks("uid-b"), ["deck-b"]);
    client.setQueryData(firestoreKeys.cards("uid-b"), ["card-b"]);

    await cleanupFirestoreUid("uid-a", client);

    expect(client.getQueryData(firestoreKeys.decks("uid-a"))).toBeUndefined();
    expect(client.getQueryData(firestoreKeys.cards("uid-a"))).toBeUndefined();
    expect(client.getQueryData(firestoreKeys.decks("uid-b"))).toEqual(["deck-b"]);
    expect(client.getQueryData(firestoreKeys.cards("uid-b"))).toEqual(["card-b"]);
    expect(stopRemoteReads).toHaveBeenCalledWith("uid-a");
  });

  it("finishes cache cleanup before surfacing a listener stop error", async () => {
    const stopError = new Error("listener stop failed");
    const operations: string[] = [];
    const client = createClient();
    stopRemoteReads.mockImplementation(() => {
      operations.push("stop");
      throw stopError;
    });
    vi.spyOn(client, "cancelQueries").mockImplementation(async () => {
      operations.push("cancel");
    });
    vi.spyOn(client, "removeQueries").mockImplementation(() => {
      operations.push("remove");
    });

    await expect(cleanupFirestoreUid("uid-a", client)).rejects.toBe(stopError);

    expect(operations).toEqual(["stop", "cancel", "remove"]);
  });

  it("removes the UID cache before surfacing a cancellation error", async () => {
    const cancellationError = new Error("query cancellation failed");
    const operations: string[] = [];
    const client = createClient();
    stopRemoteReads.mockImplementation(() => operations.push("stop"));
    vi.spyOn(client, "cancelQueries").mockImplementation(async () => {
      operations.push("cancel");
      throw cancellationError;
    });
    vi.spyOn(client, "removeQueries").mockImplementation(() => {
      operations.push("remove");
    });

    await expect(cleanupFirestoreUid("uid-a", client)).rejects.toBe(cancellationError);

    expect(operations).toEqual(["stop", "cancel", "remove"]);
  });
});
