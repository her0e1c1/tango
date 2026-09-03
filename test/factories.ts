/**
 * @file Provides reusable test data builders for Factories.
 * Tests can override only the fields they care about while receiving complete, valid application
 * objects.
 */

import type { LocalCard, RemoteCard } from "@/entities/card/testing";
import type { Deck, RemoteDeckCreateInput } from "@/entities/deck";
import type { LanguagePreference, Preferences } from "@/entities/preference";

type AppearancePreferences = Preferences["appearance"];
type StudyPreferences = Preferences["study"];
type ControlPreferences = Preferences["controls"];
type SwipeAction = ControlPreferences["cardSwipeUp"];

/**
 * Builds a complete test deck with predictable defaults and optional field overrides.
 * Tests can describe only the deck fields relevant to their scenario.
 */
export const createDeck = (
  overrides: Partial<Extract<Deck, { localMode: false }>> = {}
): Extract<Deck, { localMode: false }> => ({
  id: "deck-id",
  uid: "user-id",
  localMode: false,
  name: "Deck",
  createdAt: 0,
  updatedAt: 0,
  difficultyMax: null,
  difficultyMin: null,
  selectedTags: [],
  tagAndFilter: false,
  category: "",
  convertToBr: false,
  ...overrides,
});

/** Builds an owner-free command for creating a remote Deck. */
export const createRemoteDeckInput = (overrides: Partial<RemoteDeckCreateInput> = {}): RemoteDeckCreateInput => ({
  id: "deck-id",
  name: "Deck",
  localMode: false,
  ...overrides,
});

export const createLocalDeck = (
  overrides: Partial<Extract<Deck, { localMode: true }>> = {}
): Extract<Deck, { localMode: true }> => ({
  id: "local-deck-id",
  localMode: true,
  name: "Local Deck",
  createdAt: 0,
  updatedAt: 0,
  difficultyMax: null,
  difficultyMin: null,
  selectedTags: [],
  tagAndFilter: false,
  category: "",
  convertToBr: false,
  ...overrides,
});

/**
 * Builds a complete test card with predictable defaults and optional field overrides.
 * Tests can describe only the card fields relevant to their scenario.
 */
export const createCard = (overrides: Partial<RemoteCard> = {}): RemoteCard => ({
  id: "card-id",
  deckId: "deck-id",
  uid: "user-id",
  frontText: "front",
  backText: "back",
  tags: [],
  uniqueKey: "unique-key",
  createdAt: 0,
  updatedAt: 0,
  deletedAt: null,
  difficulty: 5,
  numberOfSeen: 0,
  ...overrides,
});

export const createLocalCard = (overrides: Partial<LocalCard> = {}): LocalCard => ({
  id: "local-card-id",
  deckId: "local-deck-id",
  frontText: "front",
  backText: "back",
  tags: [],
  uniqueKey: "unique-key",
  createdAt: 0,
  updatedAt: 0,
  deletedAt: null,
  difficulty: 5,
  numberOfSeen: 0,
  ...overrides,
});

export type PreferencesOverrides = {
  loadSample?: boolean;
  language?: LanguagePreference;
  appearance?: Partial<AppearancePreferences>;
  study?: Partial<StudyPreferences>;
  controls?: Partial<ControlPreferences>;
  darkMode?: boolean;
  fullscreen?: boolean;
  sizeBackText?: number;
  hideBodyWhenCardChanged?: boolean;
  showSwipeFeedback?: boolean;
  maxNumberOfCardsToLearn?: number;
  shuffled?: boolean;
  useCardInterval?: boolean;
  cardInterval?: number;
  keepBackTextViewed?: boolean;
  defaultAutoPlay?: boolean;
  selectedTags?: string[];
  showHelp?: boolean;
  showSwipeButtonList?: boolean;
  showPlaybackControls?: boolean;
  showCardDetails?: boolean;
  showDifficultySlider?: boolean;
  showBackTextSwipeOverlays?: boolean;
  cardSwipeUp?: SwipeAction;
  cardSwipeDown?: SwipeAction;
  cardSwipeLeft?: SwipeAction;
  cardSwipeRight?: SwipeAction;
};

const createAppearance = (
  appearance?: Partial<AppearancePreferences>,
  flat?: Partial<PreferencesOverrides>
): AppearancePreferences => ({
  darkMode: appearance?.darkMode ?? flat?.darkMode ?? false,
  fullscreen: appearance?.fullscreen ?? flat?.fullscreen ?? false,
  sizeBackText: appearance?.sizeBackText ?? flat?.sizeBackText ?? 0,
  hideBodyWhenCardChanged: appearance?.hideBodyWhenCardChanged ?? flat?.hideBodyWhenCardChanged ?? true,
  showSwipeFeedback: appearance?.showSwipeFeedback ?? flat?.showSwipeFeedback ?? false,
});

const createStudy = (study?: Partial<StudyPreferences>, flat?: Partial<PreferencesOverrides>): StudyPreferences => ({
  maxNumberOfCardsToLearn: study?.maxNumberOfCardsToLearn ?? flat?.maxNumberOfCardsToLearn ?? 10,
  shuffled: study?.shuffled ?? flat?.shuffled ?? false,
  useCardInterval: study?.useCardInterval ?? flat?.useCardInterval ?? false,
  cardInterval: study?.cardInterval ?? flat?.cardInterval ?? 60,
  keepBackTextViewed: study?.keepBackTextViewed ?? flat?.keepBackTextViewed ?? false,
  defaultAutoPlay: study?.defaultAutoPlay ?? flat?.defaultAutoPlay ?? false,
  selectedTags: study?.selectedTags ?? flat?.selectedTags ?? [],
});

const createControls = (
  controls?: Partial<ControlPreferences>,
  flat?: Partial<PreferencesOverrides>
): ControlPreferences => ({
  showHelp: controls?.showHelp ?? flat?.showHelp ?? true,
  showSwipeButtonList: controls?.showSwipeButtonList ?? flat?.showSwipeButtonList ?? true,
  showPlaybackControls: controls?.showPlaybackControls ?? flat?.showPlaybackControls ?? true,
  showCardDetails: controls?.showCardDetails ?? flat?.showCardDetails ?? true,
  showDifficultySlider: controls?.showDifficultySlider ?? flat?.showDifficultySlider ?? false,
  showBackTextSwipeOverlays: controls?.showBackTextSwipeOverlays ?? flat?.showBackTextSwipeOverlays ?? false,
  cardSwipeUp: controls?.cardSwipeUp ?? flat?.cardSwipeUp ?? "GoToNextCardMastered",
  cardSwipeDown: controls?.cardSwipeDown ?? flat?.cardSwipeDown ?? "GoToNextCardNotMastered",
  cardSwipeLeft: controls?.cardSwipeLeft ?? flat?.cardSwipeLeft ?? "GoToPrevCard",
  cardSwipeRight: controls?.cardSwipeRight ?? flat?.cardSwipeRight ?? "GoToNextCard",
});

/**
 * Builds complete test preferences with predictable defaults and optional overrides.
 * Tests can change one setting without repeating every required preference field.
 */
export const createPreferences = (overrides: PreferencesOverrides = {}): Preferences => {
  const { loadSample = true, language = "system", appearance, study, controls, ...flat } = overrides;
  return {
    loadSample,
    language,
    appearance: createAppearance(appearance, flat),
    study: createStudy(study, flat),
    controls: createControls(controls, flat),
  };
};

const NativeBlob = Blob;

/**
 * Creates a test Blob constructor that always returns the supplied blob.
 * Download tests use it to inspect generated content without depending on the browser's native
 * constructor.
 */
export const createBlobConstructor = (blob: Blob): typeof Blob =>
  new Proxy(NativeBlob, {
    construct: () => blob,
  });
