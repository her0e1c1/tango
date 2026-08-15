import type { CardId } from "./types";

import { generateId } from "@/shared/lib/generateId";

export const generateCardId = (): CardId => generateId();
