import { collection, doc } from "firebase/firestore";

import { getDb } from "@/shared/firestore";

const DECK_COLLECTION = "deck";

export const generateDeckId = (): string => doc(collection(getDb(), DECK_COLLECTION)).id;
