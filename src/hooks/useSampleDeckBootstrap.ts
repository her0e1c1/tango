import { useEffect } from "react";

import { useAuth } from "@/auth/AuthContext";
import { useDeckImport } from "@/features/import/hooks/useDeckImport";
import { useRemoteCollections } from "@/query/useRemoteCollections";

type AddSample = () => Promise<unknown>;

export const createSampleDeckBootstrapController = () => {
  const completedUids = new Set<string>();
  const pendingByUid = new Map<string, Promise<unknown>>();

  return {
    start: (uid: string, addSample: AddSample) => {
      if (completedUids.has(uid)) return;
      const pending = pendingByUid.get(uid);
      if (pending != null) return pending;

      const operation = Promise.resolve().then(addSample);
      pendingByUid.set(uid, operation);
      void operation.then(
        () => {
          pendingByUid.delete(uid);
          completedUids.add(uid);
        },
        () => pendingByUid.delete(uid)
      );
      return operation;
    },
  };
};

const sampleDeckBootstrapController = createSampleDeckBootstrapController();

export const useSampleDeckBootstrap = () => {
  const auth = useAuth();
  const remote = useRemoteCollections();
  const deckImport = useDeckImport();
  const uid = auth.status === "authenticated" ? auth.uid : "";

  useEffect(() => {
    if (uid === "" || remote.status !== "ready" || remote.syncStatus !== "synced" || remote.decks.length > 0) {
      return;
    }
    void sampleDeckBootstrapController.start(uid, deckImport.addSample)?.catch(() => undefined);
  }, [deckImport.addSample, remote.decks.length, remote.status, remote.syncStatus, uid]);
};
