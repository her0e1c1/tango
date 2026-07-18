import { useMutation } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";

import * as action from "@/action";
import { useAuth } from "@/auth/AuthContext";
import { useCardMutations } from "@/features/card/hooks/useCardMutations";
import { useDeckMutations } from "@/features/deck/hooks/useDeckMutations";
import { useRemoteCollections } from "@/query/useRemoteCollections";
import { CardBulkMutationError } from "@/query/cardMutationService";
import { useConfig } from "@/features/settings/hooks/useConfig";
import sampleCards from "../../../../sample/build/output.json";

export interface DeckImportResult {
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  deckId: DeckId;
}

type ImportRequest = { kind: "content"; name: string; content: string | File } | { kind: "sample" };

const SAMPLE_DECK_NAME = "Sample Deck";
const SAMPLE_VERSION = 1;
export const sampleDeckId = (uid: string): DeckId => `sample-v${SAMPLE_VERSION}-${uid}`;

export const useDeckImport = () => {
  const auth = useAuth();
  const config = useConfig();
  const remote = useRemoteCollections();
  const deckMutations = useDeckMutations();
  const cardMutations = useCardMutations();
  const runningRef = useRef(false);
  const [running, setRunning] = useState(false);
  const lastRequest = useRef<ImportRequest>();

  const operation = useMutation({
    retry: false,
    mutationFn: async (request: ImportRequest): Promise<DeckImportResult> => {
      const uid = auth.status === "authenticated" ? auth.uid : "";
      if (uid === "") throw new Error("A confirmed user is required for imports");
      const name = request.kind === "sample" ? SAMPLE_DECK_NAME : request.name;
      const preferredDeckId = request.kind === "sample" ? sampleDeckId(uid) : undefined;
      const rawCards =
        request.kind === "sample" ? (sampleCards as CardRaw[]) : await action.deck.parseCsv(request.content);
      let deck = remote.decks.find((candidate) =>
        preferredDeckId === undefined ? candidate.name === name : candidate.id === preferredDeckId
      );
      if (deck == null) {
        deck = action.deck.prepare({ name }, uid);
        if (preferredDeckId !== undefined) deck = { ...deck, id: preferredDeckId };
        await deckMutations.create(deck);
      }

      const existing = remote.cardsByDeckId(deck.id);
      const byUniqueKey = new Map(existing.map((card) => [card.uniqueKey, card]));
      const upserts: Card[] = [];
      const createdIds = new Set<CardId>();
      const updatedIds = new Set<CardId>();
      let created = 0;
      let updated = 0;
      let skipped = 0;
      rawCards.forEach((raw) => {
        const current = byUniqueKey.get(raw.uniqueKey);
        if (current == null) {
          const card = action.card.prepare(raw, deck);
          upserts.push(card);
          createdIds.add(card.id);
          created += 1;
        } else if (
          current.frontText === raw.frontText &&
          current.backText === raw.backText &&
          current.tags.join("\0") === raw.tags.join("\0")
        ) {
          skipped += 1;
        } else {
          upserts.push({ ...current, ...raw });
          updatedIds.add(current.id);
          updated += 1;
        }
      });
      try {
        if (upserts.length > 0) await cardMutations.bulkUpsert(upserts);
      } catch (error) {
        const failedIds = error instanceof CardBulkMutationError ? error.failedIds : upserts.map((card) => card.id);
        const failed = new Set(failedIds);
        throw Object.assign(new Error(`Deck import did not complete: ${String(error)}`), {
          result: {
            created: [...createdIds].filter((id) => !failed.has(id)).length,
            updated: [...updatedIds].filter((id) => !failed.has(id)).length,
            skipped,
            failed: failed.size,
            deckId: deck.id,
          },
        });
      }
      return { created, updated, skipped, failed: 0, deckId: deck.id };
    },
  });

  const run = useCallback(
    async (request: ImportRequest) => {
      if (runningRef.current) throw new Error("A Deck import is already running");
      runningRef.current = true;
      setRunning(true);
      lastRequest.current = request;
      try {
        return await operation.mutateAsync(request);
      } finally {
        runningRef.current = false;
        setRunning(false);
      }
    },
    [operation]
  );

  const importUrl = useCallback(
    async (url: string, name?: string) => {
      const headers: Record<string, string> = {};
      if (config.githubAccessToken !== "") {
        headers.Accept = "application/vnd.github.raw";
        headers.Authorization = `Bearer ${config.githubAccessToken}`;
      }
      const response = await fetch(url, { headers });
      if (!response.ok) throw new Error(`Unable to fetch Deck CSV (${response.status})`);
      return await run({
        kind: "content",
        name: name ?? url.split("/").pop() ?? "no name",
        content: await response.text(),
      });
    },
    [config.githubAccessToken, run]
  );

  const retry = useCallback(() => {
    const request = lastRequest.current;
    if (request != null && !runningRef.current) void run(request).catch(() => undefined);
  }, [run]);

  return {
    importFile: (file: File) => run({ kind: "content", name: file.name, content: file }),
    addSample: () => run({ kind: "sample" }),
    importUrl,
    reimport: (deck: Deck) => {
      if (deck.url == null || deck.url === "") return Promise.reject(new Error("Deck has no import URL"));
      return importUrl(deck.url, deck.name);
    },
    pending: operation.isPending || running,
    error: operation.error,
    data: operation.data,
    retry,
  };
};
