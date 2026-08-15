import type { DeckId } from "./types";

export const generateDeckId = (): DeckId => crypto.randomUUID();
