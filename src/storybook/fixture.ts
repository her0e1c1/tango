import type { Option } from "@/components/forms/Select";
import { createCard, createConfig, createDeck } from "@/test/factories";

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
  default: createDeck({
    id: "deck-default",
    name: "Deck Default Name",
    isPublic: true,
    category: "math",
    url: "http://example.com",
    createdAt: 0,
    updatedAt: 0,
  }),
  tooLongName: createDeck({
    id: "deck-too-long-name",
    name: "too long name".repeat(10),
    isPublic: true,
    category: "math",
    url: "http://example.com",
    createdAt: 0,
    updatedAt: 0,
  }),
} as const satisfies Record<string, Deck>;

export const decks = {
  default: [1, 2, 3, 4, 5, 6, 7].map((id) => ({ ...deck.default, id: `deck-${id}` })),
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
  ].map((item, index) => ({ ...item, id: `long-deck-${index + 1}` })),
} as const satisfies Record<string, Deck[]>;

export const card = {
  default: createCard({
    frontText: "front text",
    backText: "back test",
    score: 3,
    numberOfSeen: 5,
    tags: ["tag1", "tag2"],
    lastSeenAt: Date.now(),
  }),
  long: createCard({
    frontText: "too long front text ".repeat(20),
    backText: "back test".repeat(100),
    score: 3,
    numberOfSeen: 5,
    tags: ["tag1", "tag2"],
    lastSeenAt: Date.now(),
  }),
  toolong: createCard({
    frontText: "too long front text ".repeat(20),
    backText: "back test".repeat(100),
    score: 3,
    numberOfSeen: 5,
    tags: ["tag1", "tag2"],
    lastSeenAt: Date.now(),
  }),
  longTags: createCard({
    frontText: "front text",
    backText: "back test",
    score: 3,
    numberOfSeen: 5,
    tags: tags.toolong,
    lastSeenAt: Date.now(),
  }),
} as const satisfies Record<string, Card>;

export const cards = {
  default: [1, 2, 3, 4, 5, 6, 7].map((id) => ({ ...card.default, id: `default-card-${id}` })),
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
  ].map((item, index) => ({ ...item, id: `long-card-${index + 1}` })),
} as const satisfies Record<string, Card[]>;

export const config = {
  default: createConfig({
    showHeader: true,
    maxNumberOfCardsToLearn: 10,
  }),
  longUserName: createConfig(),
} as const satisfies Record<string, ConfigState>;

export const math = {
  inline: "$E = mc^2$",
  block: `
# Mass–energy equivalence

$$E = mc^2$$

The equation developed by Albert Einstein

`,
  markdown: `
A paragraph with *emphasis* and **strong importance**.

> A block quote with ~strikethrough~ and a URL: https://reactjs.org.

* Lists
* [ ] todo
* [x] done

A table:

| a | b |
| - | - |

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
