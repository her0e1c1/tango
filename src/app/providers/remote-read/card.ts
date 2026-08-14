import type { Card, CardId } from "@/entities/card";

import { collection, onSnapshot, query, where } from "firebase/firestore";
import { z } from "zod";

import { replaceCards } from "@/entities/card";
import { resetCardRead, setCardReadError, setCardReadLoading, setCardReadReady } from "@/features/card/read";
import type { RemoteSyncStatus } from "@/shared/api";
import { db } from "@/shared/firebase";
import { firestoreTimestampDateSchema, parseFirestoreDocument } from "@/shared/firestore";

const cardDtoSchema = z.object({
  id: z.string().optional(),
  frontText: z.string(),
  backText: z.string(),
  tags: z.array(z.string()),
  uniqueKey: z.string(),
  deckId: z.string(),
  uid: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  deletedAt: z.number().nullable(),
  score: z.number(),
  numberOfSeen: z.number(),
  lastSeenAt: z.number().optional(),
  nextSeeingAt: firestoreTimestampDateSchema.optional(),
  interval: z.number().optional(),
  url: z.string().optional(),
  startLine: z.number().optional(),
  endLine: z.number().optional(),
});

type CardDto = z.infer<typeof cardDtoSchema>;

const convertCardDtoToCard = (id: CardId, value: unknown): Card => {
  const dto: CardDto = parseFirestoreDocument(cardDtoSchema, "card", id, value);
  const card: Card = {
    id,
    frontText: dto.frontText,
    backText: dto.backText,
    tags: dto.tags,
    uniqueKey: dto.uniqueKey,
    deckId: dto.deckId,
    uid: dto.uid,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    deletedAt: dto.deletedAt,
    score: dto.score,
    numberOfSeen: dto.numberOfSeen,
  };
  if (dto.lastSeenAt !== undefined) card.lastSeenAt = dto.lastSeenAt;
  if (dto.nextSeeingAt !== undefined) card.nextSeeingAt = dto.nextSeeingAt;
  if (dto.interval !== undefined) card.interval = dto.interval;
  if (dto.url !== undefined) card.url = dto.url;
  if (dto.startLine !== undefined) card.startLine = dto.startLine;
  if (dto.endLine !== undefined) card.endLine = dto.endLine;
  return card;
};

const toSyncStatus = (metadata: { fromCache: boolean; hasPendingWrites: boolean }): RemoteSyncStatus => {
  if (metadata.hasPendingWrites) return "pending";
  if (metadata.fromCache) return "cached";
  return "synced";
};

const toError = (cause: unknown): Error => (cause instanceof Error ? cause : new Error(String(cause)));

const subscribeCards = (
  uid: string,
  isCurrent: () => boolean,
  onReady: (syncStatus: RemoteSyncStatus) => void,
  onError: (error: Error) => void
): (() => void) =>
  onSnapshot(
    query(collection(db, "card"), where("uid", "==", uid)),
    { includeMetadataChanges: true },
    (snapshot) => {
      if (!isCurrent()) return;
      try {
        const cards = snapshot.docs
          .map((document) => convertCardDtoToCard(document.id, document.data()))
          .filter((card) => card.deletedAt === null);
        replaceCards(cards);
        onReady(toSyncStatus(snapshot.metadata));
      } catch (cause) {
        onError(toError(cause));
      }
    },
    onError
  );

export const startCardSynchronization = (uid: string): (() => void) => {
  let active = true;
  let attempt = 0;
  let unsubscribe: (() => void) | undefined;

  const start = () => {
    const currentAttempt = ++attempt;
    unsubscribe?.();
    unsubscribe = undefined;
    setCardReadLoading(uid, start);

    const reportError = (error: Error) => {
      if (!active || attempt !== currentAttempt) return;
      unsubscribe?.();
      unsubscribe = undefined;
      setCardReadError(uid, error);
    };

    try {
      const nextUnsubscribe = subscribeCards(
        uid,
        () => active && attempt === currentAttempt,
        (syncStatus) => {
          if (!active || attempt !== currentAttempt) return;
          setCardReadReady(uid, syncStatus);
        },
        reportError
      );
      if (!active || attempt !== currentAttempt) nextUnsubscribe();
      else unsubscribe = nextUnsubscribe;
    } catch (cause) {
      reportError(toError(cause));
    }
  };

  start();

  return () => {
    active = false;
    attempt += 1;
    unsubscribe?.();
    unsubscribe = undefined;
    resetCardRead(uid);
  };
};
