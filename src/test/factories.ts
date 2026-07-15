export const createDeck = (overrides: Partial<Deck> = {}): Deck => ({
  id: "deck-id",
  uid: "user-id",
  name: "Deck",
  isPublic: false,
  createdAt: 0,
  updatedAt: 0,
  deletedAt: null,
  localMode: true,
  scoreMax: null,
  scoreMin: null,
  selectedTags: [],
  tagAndFilter: false,
  category: "",
  convertToBr: false,
  ...overrides,
});

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
  uid: "user-id",
  isAnonymous: true,
  displayName: "",
  selectedTags: [],
  lastUpdatedAt: 0,
  githubAccessToken: "",
  loadSample: false,
  localMode: true,
  ...overrides,
});

export const createRootState = (overrides: Partial<RootState> = {}): RootState => ({
  deck: { byId: {}, categories: [] },
  card: { byId: {}, tags: [] },
  config: createConfig(),
  ...overrides,
});

const NativeBlob = Blob;

export const createBlobConstructor = (blob: Blob): typeof Blob =>
  new Proxy(NativeBlob, {
    construct: () => blob,
  });
