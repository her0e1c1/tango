import { doc, Timestamp, writeBatch } from "firebase/firestore";
import { z } from "zod";

import { cardCreateSchema } from "@/entities/card";
import { deckCreateSchema, toDeckDocument } from "@/entities/deck";
import { studySessionSchema, toStudySessionDocument } from "@/entities/study-session";
import { writeLocally } from "@/shared/firestore-write";
import { db } from "@/shared/firebase";
import { omitUndefined } from "@/shared/lib/omitUndefined";

const marker = "tango-firestore-migrated";
const legacyEnvelope = z.object({ version: z.number(), state: z.record(z.string(), z.unknown()) });
const legacyRows = z.array(z.record(z.string(), z.unknown()));

function readLegacy(key: string): Record<string, unknown> | undefined {
  const raw = localStorage.getItem(key);
  return raw === null ? undefined : legacyEnvelope.parse(JSON.parse(raw)).state;
}

/** Release compatibility only: retain the original keys and import once before editing becomes available. */
export async function migrateLegacyData(uid: string): Promise<void> {
  if (localStorage.getItem(marker) !== null) return;
  const legacyDecks = readLegacy("tango-local-decks");
  const legacyCards = readLegacy("tango-local-cards");
  if (legacyDecks === undefined && legacyCards === undefined) return;
  const decks = legacyRows.parse(legacyDecks?.localDecks ?? []);
  const cards = legacyRows.parse(legacyCards?.localCards ?? []);
  const sessions = z.record(z.string(), z.unknown()).parse(readLegacy("tango-study")?.sessionsByDeckId ?? {});
  const idFor = (id: string) => `${uid}-legacy-${id}`;
  const documents: { collection: string; id: string; data: Record<string, unknown> }[] = [];
  const deckIds = new Set<string>();
  for (const raw of decks) {
    const value = deckCreateSchema.parse(raw);
    deckIds.add(value.id);
    const id = idFor(value.id);
    const timestamp = typeof raw.createdAt === "number" ? raw.createdAt : Date.now();
    documents.push({
      collection: "deck",
      id,
      data: {
        ...toDeckDocument(uid, { ...value, id }, timestamp),
        updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : timestamp,
      },
    });
  }
  for (const raw of cards) {
    const value = cardCreateSchema.parse({
      ...raw,
      uid,
      ...(typeof raw.nextSeeingAt === "string" ? { nextSeeingAt: new Date(raw.nextSeeingAt) } : {}),
    });
    if (!deckIds.has(value.deckId)) throw new Error("A legacy card has no matching deck");
    const id = idFor(value.id);
    const timestamp = typeof raw.createdAt === "number" ? raw.createdAt : Date.now();
    documents.push({
      collection: "card",
      id,
      data: omitUndefined({
        ...value,
        id,
        deckId: idFor(value.deckId),
        createdAt: timestamp,
        updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : timestamp,
      }),
    });
  }
  for (const [deckId, raw] of Object.entries(sessions)) {
    if (!deckIds.has(deckId)) continue;
    const session = studySessionSchema.parse(raw);
    const timestamp = Timestamp.fromMillis(session.lastStudiedAt);
    const value = {
      ...session,
      sessionId: idFor(session.sessionId),
      deckId: idFor(deckId),
      cardOrderIds: session.cardOrderIds.map(idFor),
      remote: { uid, startedAt: session.lastStudiedAt },
    };
    documents.push({
      collection: "studySession",
      id: value.sessionId,
      data: {
        ...toStudySessionDocument(value),
        endedAt: null,
        endReason: null,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    });
  }
  // Preserve parent order and stay within the rules budget of 20 document lookups per batch.
  // Fixed IDs make an interrupted import repeatable.
  for (let index = 0; index < documents.length; index += 20) {
    const batch = writeBatch(db);
    const references = documents.slice(index, index + 20).map((document) => {
      const reference = doc(db, document.collection, document.id);
      batch.set(reference, document.data);
      return reference;
    });
    await writeLocally(uid, references, () => batch.commit());
  }
  // This marker prevents an account switch from importing the old anonymous data into another UID.
  localStorage.setItem(marker, uid);
}
