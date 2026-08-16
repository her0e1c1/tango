import { generateId } from "@/shared/lib/generateId";
import type { CardId } from "../model/types";

export const generateCardId = (): CardId => generateId();
