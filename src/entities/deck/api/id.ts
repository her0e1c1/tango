import { generateId } from "@/shared/lib/generateId";
import type { DeckId } from "../model/types";

// Generates a new Deck identifier for local or remote creation.
export const generateDeckId = (): DeckId => generateId();
