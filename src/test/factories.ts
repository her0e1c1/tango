/**
 * @file Provides reusable test data builders for Factories.
 * Tests can override only the fields they care about while receiving complete, valid application
 * objects.
 */

/**
 * Builds a complete test deck with predictable defaults and optional field overrides.
 * Tests can describe only the deck fields relevant to their scenario.
 */
export const createDeck = (overrides: Partial<Deck> = {}): Deck => ({
  id: "deck-id",
  uid: "user-id",
  name: "Deck",
  isPublic: false,
  createdAt: 0,
  updatedAt: 0,
  deletedAt: null,
  scoreMax: null,
  scoreMin: null,
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
export const createCard = (overrides: Partial<Card> = {}): Card => ({
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
  score: 0,
  numberOfSeen: 0,
  ...overrides,
});

/**
 * Builds a complete test configuration with predictable defaults and optional overrides.
 * Tests can change one setting without repeating every required configuration field.
 */
export const createConfig = (overrides: Partial<ConfigState> = {}): ConfigState => ({
  useCardInterval: false,
  showSwipeButtonList: true,
  showScoreSlider: false,
  showHeader: true,
  fullscreen: false,
  shuffled: false,
  sizeBackText: 0,
  maxNumberOfCardsToLearn: 10,
  hideBodyWhenCardChanged: true,
  showSwipeFeedback: false,
  keepBackTextViewed: false,
  defaultAutoPlay: false,
  cardInterval: 60,
  cardSwipeUp: "GoToNextCardMastered",
  cardSwipeDown: "GoToNextCardNotMastered",
  cardSwipeLeft: "GoToPrevCard",
  cardSwipeRight: "GoToNextCard",
  darkMode: false,
  selectedTags: [],
  githubAccessToken: "",
  ...overrides,
});

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
