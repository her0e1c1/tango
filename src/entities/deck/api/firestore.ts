import { collection, doc } from "firebase/firestore";

import { db } from "@/shared/firebase";

const DECK_COLLECTION = "deck";

export const generateDeckId = (): string => doc(collection(db, DECK_COLLECTION)).id;
