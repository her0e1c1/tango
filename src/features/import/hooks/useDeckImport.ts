import { useMutation } from "@tanstack/react-query";
import { useRef } from "react";
import { useSelector } from "react-redux";

import * as action from "@/action";
import { useAuth } from "@/auth/AuthContext";
import { useCardMutations } from "@/features/card/hooks/useCardMutations";
import { useDeckMutations } from "@/features/deck/hooks/useDeckMutations";
import { useRemoteCollections } from "@/query/useRemoteCollections";
import { CardBulkMutationError } from "@/query/cardMutationService";
import * as selector from "@/selector";

export interface DeckImportResult {
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  deckId: DeckId;
}

type ImportRequest = { name: string; content: string | File };

export const useDeckImport = () => {
  const auth = useAuth();
  const config = useSelector(selector.config.get());
  const remote = useRemoteCollections();
  const deckMutations = useDeckMutations();
  const cardMutations = useCardMutations();
  const running = useRef(false);
  const lastRequest = useRef<ImportRequest>();

  const operation = useMutation({
    retry: false,
    mutationFn: async ({ name, content }: ImportRequest): Promise<DeckImportResult> => {
      const rawCards = await action.deck.parseCsv(content);
      let deck = remote.decks.find((candidate) => candidate.name === name);
      if (deck == null) {
        const uid = auth.status === "authenticated" ? auth.uid : "";
        if (!config.localMode && uid === "") throw new Error("A confirmed user is required for remote imports");
        deck = action.deck.prepare({ name }, { uid, localMode: config.localMode });
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
        if (upserts.length > 0) await cardMutations.bulkUpsert(upserts, deck.localMode);
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

  const run = async (request: ImportRequest) => {
    if (running.current) throw new Error("A Deck import is already running");
    running.current = true;
    lastRequest.current = request;
    try {
      return await operation.mutateAsync(request);
    } finally {
      running.current = false;
    }
  };

  const importUrl = async (url: string, name?: string) => {
    const headers: Record<string, string> = {};
    if (config.githubAccessToken !== "") {
      headers.Accept = "application/vnd.github.raw";
      headers.Authorization = `Bearer ${config.githubAccessToken}`;
    }
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error(`Unable to fetch Deck CSV (${response.status})`);
    return await run({ name: name ?? url.split("/").pop() ?? "no name", content: await response.text() });
  };

  return {
    importFile: (file: File) => run({ name: file.name, content: file }),
    importUrl,
    reimport: (deck: Deck) => {
      if (deck.url == null || deck.url === "") return Promise.reject(new Error("Deck has no import URL"));
      return importUrl(deck.url, deck.name);
    },
    pending: operation.isPending || running.current,
    error: operation.error,
    data: operation.data,
    retry: () => {
      const request = lastRequest.current;
      if (request != null && !running.current) void run(request).catch(() => undefined);
    },
  };
};
