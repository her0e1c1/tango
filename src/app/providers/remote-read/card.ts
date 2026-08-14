import type { Card, CardId } from "@/entities/card";

import { collection, onSnapshot, query, where } from "firebase/firestore";
import { z } from "zod";

import { replaceCards } from "@/entities/card";
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

const convertCardDtoToCard = (id: CardId, value: unknown): Card => {
  const dto = parseFirestoreDocument(cardDtoSchema, "card", id, value);
  const card: Card = { ...dto, id };
  if (dto.url === undefined) delete card.url;
  if (dto.startLine === undefined) delete card.startLine;
  if (dto.endLine === undefined) delete card.endLine;
  if (dto.lastSeenAt === undefined) delete card.lastSeenAt;
  if (dto.nextSeeingAt === undefined) delete card.nextSeeingAt;
  if (dto.interval === undefined) delete card.interval;
  return card;
};

export const subscribeCards = (uid: string, onReady: () => void, onError: (error: Error) => void): (() => void) =>
  onSnapshot(
    query(collection(db, "card"), where("uid", "==", uid)),
    (snapshot) => {
      try {
        const cards = snapshot.docs
          .map((document) => convertCardDtoToCard(document.id, document.data()))
          .filter((card) => card.deletedAt === null);
        replaceCards(cards);
        onReady();
      } catch (cause) {
        onError(cause instanceof Error ? cause : new Error(String(cause)));
      }
    },
    onError
  );
