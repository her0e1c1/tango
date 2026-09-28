import type { z } from "zod";
import type { fsrsStateSchema } from "./schema";

/** FSRS-6.0 review state; all instants are Unix milliseconds. */
export type FsrsState = z.infer<typeof fsrsStateSchema>;

/** Firestore-backed Card data whose ownership and deletion metadata must remain at the Entity boundary. */
export type RemoteCard = CardCreate & {
  /** Review schedule; null means the Card has not been reviewed. */
  fsrs: FsrsState | null;
  /** Document creation time in Unix milliseconds. */
  createdAt: number;
  /** Last modification time in Unix milliseconds. */
  updatedAt: number;
};
export type Card = RemoteCard;
/** Shared create/edit content without identity or persistence metadata. */
export type CardContentInput = {
  /** Non-blank question content. */
  frontText: string;
  /** Non-blank answer content. */
  backText: string;
  /** Tags attached to the Card; content forms require non-blank, unique entries. */
  tags: string[];
};
/** Validated payload used to create a remote Card document. */
type CardCreate = CardContentInput & {
  /** Non-blank identity used to match imported content. */
  uniqueKey: string;
  /** Non-empty stable identity of the Card document. */
  id: CardId;
  /** Non-empty identity of the containing Deck. */
  deckId: string;
  /** Non-empty Firebase UID of the Card owner. */
  uid: string;
  /** Deletion time in Unix milliseconds; null means active. */
  deletedAt: number | null;
};
/** Input accepted at the owner-free Card creation boundary. */
type CardContentCreateInput = Omit<CardCreate, "uid" | "deletedAt"> & {
  /** Deletion time in Unix milliseconds; omitted or undefined defaults to null (active). */
  deletedAt?: number | null | undefined;
};
/** Owner-free fields accepted by the single-Card creation workflow. */
export type CardCreateCommand = Pick<
  CardContentCreateInput,
  "id" | "deckId" | "frontText" | "backText" | "tags" | "uniqueKey"
>;
/** Validated stable identifier for a Card. */
export type CardId = string;
/** Persistence-agnostic Card edit accepted by mutation orchestration. */
export type CardEditInput = {
  /** Non-empty stable identity of the Card to update. */
  id: CardId;
  /** Non-blank question content; omitted or undefined preserves the current value. */
  frontText?: string | undefined;
  /** Non-blank answer content; omitted or undefined preserves the current value. */
  backText?: string | undefined;
  /** Replacement tags; omitted or undefined preserves the current collection. */
  tags?: string[] | undefined;
  /** Non-blank import identity; omitted or undefined preserves the current value. */
  uniqueKey?: string | undefined;
  /** Review schedule update; omitted or undefined preserves the schedule and null resets it. */
  fsrs?: FsrsState | null | undefined;
};
/** Create or edit command applied during a bulk Card mutation. */
export type CardMutation =
  | {
      /** Selects creation of a new Card. */
      kind: "create";
      /** Owner-free creation payload; the workflow supplies ownership. */
      card: CardContentCreateInput;
    }
  | {
      /** Selects a partial update to an existing Card. */
      kind: "edit";
      /** Identity and content fields to update. */
      card: CardEditInput;
    };
/** User-editable Card content independent of identity and persistence metadata. */
export type CardRaw = Pick<Card, "frontText" | "backText" | "uniqueKey" | "tags">;
