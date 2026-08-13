import type { Card } from "../model/card";

import { collection, query, where } from "firebase/firestore";

import type { RemoteSubscriptionProps } from "@/shared/api";
import { getDb, subscribeReads } from "@/shared/firestore";
import { mapStudyProgressDocument } from "@/entities/study-progress/@x/card";
import { mapCardDocument } from "./firestoreDocument";

export const subscribeCardReads = (props: RemoteSubscriptionProps<Card>): (() => void) =>
  subscribeReads({
    query: query(collection(getDb(), "card"), where("uid", "==", props.uid)),
    mapDocument: (id, value) => ({ ...mapCardDocument(id, value), ...mapStudyProgressDocument(id, value), id }),
    isActive: (card) => card.deletedAt === null,
    keyOf: (card) => card.id,
    onSnapshot: props.onSnapshot,
    onError: props.onError,
  });
