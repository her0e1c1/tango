export type CardFilter = {
  /** Selected tags; an empty collection does not restrict Cards. */
  selectedTags: string[];
  /** True requires every selected tag; false requires any selected tag. */
  tagAndFilter: boolean;
};

/** Deck rendering category or syntax-highlighting language. */
export type Category = string;
/** Stable identifier shared by Deck boundaries and dependent Entities. */
export type DeckId = string;

/** Deck data used throughout the application, including the fields needed by its persistence mode. */
export type Deck = {
  /** Stable identity referenced by Cards, routes, study sessions, and persistence boundaries. */
  id: DeckId;
  /** Human-readable label shown wherever a Deck is selected or summarized. */
  name: string;
  /** Optional source location retained for Decks whose content originates from an external resource. */
  url?: string | undefined;
  /** Whether the Deck is marked for public visibility; local Decks normally keep this disabled. */
  isPublic: boolean;
  /** Conditions used to select Cards when starting a study session. */
  studyFilter?: CardFilter | undefined;
  /** Independent browsing conditions; an unset filter displays every Card. */
  cardFilter?: CardFilter | undefined;
  /** Fallback rendering category when no supported Card tag supplies a more specific category. */
  category: Category;
  /** Whether imported text should convert two consecutive line breaks into one HTML `<br />`. */
  convertToBr: boolean;
  /** Unix epoch time in milliseconds when the Deck was created. */
  createdAt: number;
  /** Unix epoch time in milliseconds when the Deck was last changed. */
  updatedAt: number;
  /** Firebase UID of the Deck owner, including anonymous users. */
  uid: string;
};

/** Owner-free input accepted at the remote Deck creation boundary. */
export type RemoteDeckCreateInput = {
  /** Non-empty stable identity assigned to the new Deck. */
  id: DeckId;
  /** Deck label; validation trims whitespace and requires a non-empty value. */
  name: string;
  /** Optional source URL; when supplied, it must be a valid URL. */
  url?: string | undefined;
  /** Public visibility; omitted or undefined defaults to false. */
  isPublic?: boolean | undefined;
  /** Optional study conditions; an unset filter does not restrict Cards by tag. */
  studyFilter?: CardFilter | undefined;
  /** Optional independent browsing filter; an unset filter displays every Card. */
  cardFilter?: CardFilter | undefined;
  /** Rendering category; omitted or undefined defaults to an empty string. */
  category?: Category | undefined;
  /** Line-break conversion; omitted or undefined defaults to false. */
  convertToBr?: boolean | undefined;
};
