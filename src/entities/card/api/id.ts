import { generateId } from "@/shared/lib/generateId";
import type { CardId } from "../model/types";

// Generates a new Card identifier for local or remote creation.
export const generateCardId = (): CardId => generateId();
