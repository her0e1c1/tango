import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import type { Preferences } from "@/entities/preference";

import { createCard, createDeck, createPreferences } from "@/test/factories";

interface Option {
  label: string;
  value: string;
}

// Keeps time-based Storybook inputs stable without coupling production code to a Storybook clock.
export const timestamp = Date.UTC(2026, 6, 1, 12, 0, 0);

export const form = {
  options: {
    default: [
      { label: "item 1", value: "value 1" },
      { label: "item 2", value: "value 2" },
      { label: "item 3", value: "value 3" },
    ],
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
    category: "math",
    url: "http://example.com",
    createdAt: 0,
    updatedAt: 0,
  }),
  tooLongName: createDeck({
    id: "deck-too-long-name",
    name: "too long name".repeat(10),
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

const createLongCard = () =>
  createCard({
    frontText: "too long front text ".repeat(20),
    backText: "back test".repeat(100),
    difficulty: 3,
    numberOfSeen: 5,
    tags: ["tag1", "tag2"],
    lastSeenAt: timestamp,
  });

export const card = {
  default: createCard({
    frontText: "front text",
    backText: "back test",
    difficulty: 3,
    numberOfSeen: 5,
    tags: ["tag1", "tag2"],
    lastSeenAt: timestamp,
  }),
  long: createLongCard(),
  toolong: createLongCard(),
  longTags: createCard({
    frontText: "front text",
    backText: "back test",
    difficulty: 3,
    numberOfSeen: 5,
    tags: tags.toolong,
    lastSeenAt: timestamp,
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

export const preferences = {
  default: createPreferences({
    maxNumberOfCardsToLearn: 10,
  }),
} as const satisfies Record<string, Preferences>;

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
