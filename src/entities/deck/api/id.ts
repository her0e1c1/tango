import { generateId } from "@/shared/lib/generateId";
import type { DeckId } from "../model/types";

export const generateDeckId = (): DeckId => generateId();
