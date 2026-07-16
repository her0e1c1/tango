import type { QueryClient } from "@tanstack/react-query";

import { stopSubscriptions } from "@/lib/realtimeSubscriptions";
import { queryClient } from "@/query/client";
import { firestoreKeys } from "@/query/firestoreKeys";
import { stopRemoteReads } from "@/query/remoteReadSession";

export const cleanupFirestoreUid = async (uid: string, client: QueryClient = queryClient) => {
  const filter = { queryKey: firestoreKeys.uid(uid) };
  const errors: unknown[] = [];
  try {
    stopRemoteReads(uid);
  } catch (error) {
    errors.push(error);
  }
  try {
    stopSubscriptions();
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
