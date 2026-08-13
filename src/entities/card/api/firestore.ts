import { collection, doc } from "firebase/firestore";

import { getDb } from "@/shared/firestore";

const CARD_COLLECTION = "card";

export const generateCardId = (): string => doc(collection(getDb(), CARD_COLLECTION)).id;
