/** FSRS-6.0 review state; all instants are Unix milliseconds. */
export type FsrsState = {
  /** Current scheduling phase after a review. */
  state: /** Initial learning steps before entering the regular review schedule. */
    | "learning"
    /** Regular review schedule after completing learning steps. */
    | "review"
    /** Learning steps repeated after a lapse during review. */
    | "relearning";
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
};

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
export type CardCreate = CardContentInput & {
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
/** Input accepted at the remote Card creation boundary. */
export type CardCreateInput = Omit<CardCreate, "deletedAt"> & {
  /** Deletion time in Unix milliseconds; omitted or undefined defaults to null (active). */
  deletedAt?: number | null | undefined;
};
/** Input accepted at the owner-free Card creation boundary. */
type CardContentCreateInput = Omit<CardCreateInput, "uid">;
/** Owner-free fields accepted by the single-Card creation workflow. */
export type CardCreateCommand = Pick<
  CardContentCreateInput,
  "id" | "deckId" | "frontText" | "backText" | "tags" | "uniqueKey"
>;
/** Validated stable identifier for a Card. */
export type CardId = string;
/** Validated editable fields for a remote Card. */
export type CardEdit = CardContentEdit & {
  /** Non-empty Firebase UID of the Card owner. */
  uid: string;
};
/** Validated partial edit for a owner-free Card. */
type CardContentEdit = {
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
};
/** Persistence-agnostic Card edit accepted by mutation orchestration. */
export type CardEditInput = CardContentEdit;
/** Create payload accepted by a bulk Card mutation. */
type CardMutationCreateInput = CardContentCreateInput;
/** Create or edit command applied during a bulk Card mutation. */
export type CardMutation =
  | {
      /** Selects creation of a new Card. */
      kind: "create";
      /** Owner-free creation payload; the workflow supplies ownership. */
      card: CardMutationCreateInput;
    }
  | {
      /** Selects a partial update to an existing Card. */
      kind: "edit";
      /** Identity and content fields to update. */
      card: CardEditInput;
    };
/** User-editable Card content independent of identity and persistence metadata. */
export type CardRaw = Pick<Card, "frontText" | "backText" | "uniqueKey" | "tags">;
/** Validated owner and Card payload for a remote edit command. */
export type EditCardInput = {
  /** Confirmed Firebase UID, which must match the payload owner. */
  uid: string;
  /** Validated identity, ownership, and partial content update. */
  card: CardEdit;
};
/** Validated owner and Card identity for a remote delete command. */
export type DeleteCardInput = {
  /** Confirmed Firebase UID, which must match the payload owner. */
  uid: string;
  /** Identity and ownership of the Card to delete. */
  card: {
    /** Non-empty stable identity of the Card to delete. */
    id: CardId;
    /** Non-empty Firebase UID of the Card owner. */
    uid: string;
  };
};
