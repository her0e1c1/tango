/**
 * @file Provides the import feature's Use Sample Deck Bootstrap React hook.
 * The hook combines state and operations behind one interface so components do not need to
 * coordinate services themselves.
 */

import { useEffect } from "react";

import { useDecks } from "@/entities/deck";
import { useSession } from "@/entities/session";
import { useDeckImport } from "@/features/import/hooks/useDeckImport";

type AddSample = () => Promise<unknown>;

/**
 * Creates and configures a sample deck bootstrap controller.
 * Optional dependencies or settings let production code and tests reuse the same behavior in
 * different environments.
 */
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

/**
 * Provides the sample deck bootstrap values and operations needed by React components.
 * Callers receive one focused interface without coordinating the import feature's stores and
 * services themselves.
 */
export const useSampleDeckBootstrap = () => {
  const auth = useSession();
  const remote = useDecks();
  const deckImport = useDeckImport();
  const uid = auth.status === "authenticated" ? auth.uid : "";

  useEffect(() => {
    if (uid === "" || remote.status !== "ready" || remote.syncStatus !== "synced" || remote.decks.length > 0) {
      return;
    }
    void sampleDeckBootstrapController.start(uid, deckImport.addSample)?.catch(() => undefined);
  }, [deckImport.addSample, remote.decks.length, remote.status, remote.syncStatus, uid]);
};
