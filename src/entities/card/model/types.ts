/** User-editable Card content, including the import identity. */
export interface CardRaw {
  /** Non-blank question content. */
  frontText: string;
  /** Non-blank answer content. */
  backText: string;
  /** Tags attached to the Card; content forms require non-blank, unique entries. */
  tags: string[];
  /** Non-blank identity used to match imported content. */
  uniqueKey: string;
}

/** Shared create/edit form content; creation assigns the import identity. */
export type CardContentInput = Omit<CardRaw, "uniqueKey">;

/** Stable, non-empty Card identifier. */
export type CardId = string;

/** Validated payload used to create a remote Card document. */
export interface CardCreate extends CardRaw {
  /** Stable identity of the Card document. */
  id: CardId;
  /** Non-empty identity of the containing Deck. */
  deckId: string;
  /** Non-empty Firebase UID of the owner. */
  uid: string;
  /** Deletion time in Unix milliseconds; null means the Card is active. */
  deletedAt: number | null;
}

/** Creation accepts an omitted deletion time, which validation defaults to null. */
export type CardCreateInput = Omit<CardCreate, "deletedAt"> & {
  /** Deletion time in Unix milliseconds; omitted or undefined defaults to null. */
  deletedAt?: number | null | undefined;
};
type CardContentCreateInput = Omit<CardCreateInput, "uid">;
/** Owner-free fields accepted by the single-Card creation workflow. */
export type CardCreateCommand = Pick<
  CardContentCreateInput,
  "id" | "deckId" | "frontText" | "backText" | "tags" | "uniqueKey"
>;

/** FSRS-6 scheduling state; a Card without a review has no state. */
export interface FsrsState {
  /** Current scheduling phase after a review. */
  state: "learning" | "review" | "relearning";
  /** Next review time in Unix milliseconds. */
  dueAt: number;
  /** Positive memory stability in days. */
  stability: number;
  /** Memory difficulty from 1 through 10. */
  difficulty: number;
  /** Most recent review time in Unix milliseconds. */
  lastReviewedAt: number;
  /** Positive integer count of completed reviews. */
  reps: number;
  /** Non-negative integer lapse count, no greater than reps. */
  lapses: number;
  /** Scheduled interval in days, from 0 through 36,500. */
  scheduledDays: number;
  /** Non-negative integer index of the learning step. */
  learningSteps: number;
}

/** Firestore-backed Card data, including ownership and deletion metadata. */
export interface RemoteCard extends CardCreate {
  /** Review schedule; null means the Card has not been reviewed. */
  fsrs: FsrsState | null;
  /** Document creation time in Unix milliseconds. */
  createdAt: number;
  /** Last modification time in Unix milliseconds. */
  updatedAt: number;
}
export type Card = RemoteCard;

/** Partial content update; omitted fields retain their saved values. */
export type CardEditInput = { [Field in keyof CardRaw]?: CardRaw[Field] | undefined } & {
  /** Identity of the Card to update. */
  id: CardId;
};
export type CardEdit = CardEditInput & {
  /** Firebase UID that must match the authenticated owner. */
  uid: string;
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

export interface EditCardInput {
  /** Confirmed Firebase UID, which must match the payload owner. */
  uid: string;
  /** Validated identity, ownership, and partial content update. */
  card: CardEdit;
}
export interface DeleteCardInput {
  /** Confirmed Firebase UID, which must match the payload owner. */
  uid: string;
  /** Identity and ownership of the Card to delete. */
  card: Pick<CardCreate, "id" | "uid">;
}
