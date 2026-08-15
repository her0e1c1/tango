import { useEffect } from "react";

import { useAuthSession } from "@/entities/auth";
import type { Deck } from "@/entities/deck";
import { fetchDecks } from "@/entities/deck";
import { useDeckImport } from "./useDeckImport";
import type { DeckImportOptions } from "./useDeckImport";

type AddSample = () => Promise<unknown>;
type FetchDecks = (uid: string) => Promise<Deck[]>;

/**
 * Creates and configures a sample deck bootstrap controller.
 * Optional dependencies or settings let production code and tests reuse the same behavior in
 * different environments.
 */
const createSampleDeckBootstrapController = () => {
  const completedUids = new Set<string>();
  const pendingByUid = new Map<string, Promise<unknown>>();

  return {
    start: (uid: string, addSample: AddSample, fetchDecksFn: FetchDecks) => {
      if (completedUids.has(uid)) return;
      const pending = pendingByUid.get(uid);
      if (pending != null) return pending;

      const operation = (async () => {
        const remoteDecks = await fetchDecksFn(uid);
        if (remoteDecks.length === 0) {
          await addSample();
        }
      })();

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
export const useSampleDeckBootstrap = (options: DeckImportOptions) => {
  const auth = useAuthSession();
  const deckImport = useDeckImport(options);
  const uid = auth.status === "authenticated" ? auth.uid : "";
  const fetchDecksFn = options.fetchDecks ?? fetchDecks;

  useEffect(() => {
    if (uid === "" || options.decks.length > 0) {
      return;
    }
    void sampleDeckBootstrapController.start(uid, deckImport.addSample, fetchDecksFn)?.catch(() => undefined);
  }, [deckImport.addSample, fetchDecksFn, options.decks.length, uid]);
};
