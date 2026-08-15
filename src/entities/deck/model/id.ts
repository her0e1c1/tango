import type { DeckId } from "./types";

import { generateId } from "@/shared/lib/generateId";

export const generateDeckId = (): DeckId => generateId();
