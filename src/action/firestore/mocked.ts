import { getFirestore, doc, collection } from "firebase/firestore";

export const generateDeckId = (): string => doc(collection(getFirestore(), "deck")).id;

export const generateCardId = (): string => doc(collection(getFirestore(), "card")).id;

export const getTimestamp = () => new Date().getTime();
