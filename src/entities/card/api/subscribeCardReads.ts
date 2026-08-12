import type { Card } from "../model/card";

import { collection, query, where } from "firebase/firestore";

import type { RemoteSubscriptionProps } from "@/shared/api";
import { getDb } from "@/shared/firebase/firestore-runtime";
import { subscribeReads } from "@/shared/firebase/subscribeReads";
import { mapCardDocument } from "./firestoreDocument";

export const subscribeCardReads = (props: RemoteSubscriptionProps<Card>): (() => void) =>
  subscribeReads({
    query: query(collection(getDb(), "card"), where("uid", "==", props.uid)),
    mapDocument: mapCardDocument,
    isActive: (card) => card.deletedAt === null,
    onSnapshot: props.onSnapshot,
    onError: props.onError,
  });
