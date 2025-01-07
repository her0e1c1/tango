export const form = {
  options: {
    default: [
      { label: "item 1", value: "value 1" },
      { label: "item 2", value: "value 2" },
      { label: "item 3", value: "value 3" },
    ],
    toomany: Array.from({ length: 30 }, (_, k) => ({ label: `tag ${k}`, value: `tag${k}` })),
  } as const satisfies Record<string, Option[]>,
} as const;

export const tags = {
  default: ["tag 1", "tag 2", "tag 3"],
  toolong: Array.from({ length: 100 }, (_, k) => `tag ${k}`),
} as const satisfies Record<string, string[]>;

export const deck = {
  default: {
    name: "Deck Default Name",
    isPublic: true,
    currentIndex: 0,
    category: "math",
    url: "http://example.com",
    cardOrderIds: ["3", "2", "1"],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as Deck,
  tooLongName: {
    name: "too long name".repeat(10),
    isPublic: true,
    currentIndex: 0,
    category: "math",
    url: "http://example.com",
    cardOrderIds: [] as string[],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as Deck,
} as const satisfies Record<string, Deck>;

export const decks = {
  default: [1, 2, 3, 4, 5, 6, 7].map(() => deck.default),
  long: [
    deck.default,
    deck.tooLongName,
    deck.default,
    deck.default,
    deck.default,
    deck.tooLongName,
    deck.default,
    deck.tooLongName,
    deck.default,
    deck.default,
    deck.default,
    deck.tooLongName,
  ],
} as const satisfies Record<string, Deck[]>;

export const card = {
  default: {
    frontText: "front text",
    backText: "back test",
    score: 3,
    numberOfSeen: 5,
    tags: ["tag1", "tag2"],
    lastSeenAt: new Date().getTime(),
  } as Card,
  long: {
    frontText: "too long front text ".repeat(20),
    backText: "back test".repeat(100),
    score: 3,
    numberOfSeen: 5,
    tags: ["tag1", "tag2"],
    lastSeenAt: new Date().getTime(),
  } as Card,
  toolong: {
    frontText: "too long front text ".repeat(20),
    backText: "back test".repeat(100),
    score: 3,
    numberOfSeen: 5,
    tags: ["tag1", "tag2"],
    lastSeenAt: new Date().getTime(),
  } as Card,
} as const satisfies Record<string, Card>;

export const cards = {
  default: [1, 2, 3, 4, 5, 6, 7].map(() => card.default),
  long: [
    card.default,
    card.toolong,
    card.default,
    card.default,
    card.default,
    card.toolong,
    card.default,
    card.toolong,
    card.default,
    card.default,
    card.default,
    card.toolong,
  ],
} as const satisfies Record<string, Card[]>;

export const config = {
  default: {
    showHeader: true,
    maxNumberOfCardsToLearn: 10,
  } as ConfigState,
  longUserName: {
    displayName: "this is a too long user name",
  } as ConfigState,
} as const satisfies Record<string, ConfigState>;

export const math = {
  inline: "$E = mc^2$",
  block: `
  ゆえに
  $$E = mc^2$$
  が成立する
  `,
} as const;

export const code = {
  default: 'print("hello world!")',
  longtext: `
  this is long text.

  with line breaks
  `
    .repeat(20)
    .trim(),
} as const;
