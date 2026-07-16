import { doc, collection } from "firebase/firestore";
import { getDb } from "@/firestoreRuntime";

export const generateDeckId = (): string => doc(collection(getDb(), "deck")).id;

export const generateCardId = (): string => doc(collection(getDb(), "card")).id;

export const getTimestamp = () => Date.now();
