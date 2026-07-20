/**
 * @file Provides shared remote-data behavior for Cleanup.
 * Feature hooks use this layer to read and update Firestore data without owning cache or
 * subscription details.
 */

import type { QueryClient } from "@tanstack/react-query";

import { queryClient } from "@/query/client";
import { firestoreKeys } from "@/query/cache/firestoreKeys";
import { stopRemoteReads } from "@/query/reads/remoteReadSession";

/**
 * Stops remote reads and removes cached queries that belong to one user.
 * Logout and account switches call this boundary so data from the previous identity cannot remain
 * visible.
 */
export const cleanupFirestoreUid = async (uid: string, client: QueryClient = queryClient) => {
  const filter = { queryKey: firestoreKeys.uid(uid) };
  const errors: unknown[] = [];
  try {
    stopRemoteReads(uid);
  } catch (error) {
    errors.push(error);
  }
  try {
    await client.cancelQueries(filter);
  } catch (error) {
    errors.push(error);
  }
  try {
    client.removeQueries(filter);
  } catch (error) {
    errors.push(error);
  }
  if (errors.length > 0) {
    throw errors[0];
  }
};
