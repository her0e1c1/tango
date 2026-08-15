import type { CardId } from "./types";

export const generateCardId = (): CardId => crypto.randomUUID();
