import type { RemoteSnapshotMetadata } from "@/shared/api";

import type { SnapshotMetadata } from "firebase/firestore";

export const toRemoteSnapshotMetadata = (
  metadata: Pick<SnapshotMetadata, "fromCache" | "hasPendingWrites">
): RemoteSnapshotMetadata => ({
  fromCache: metadata.fromCache,
  hasPendingWrites: metadata.hasPendingWrites,
});
