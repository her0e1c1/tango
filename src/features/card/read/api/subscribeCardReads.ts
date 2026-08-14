import type { Card } from "@/entities/card";

import { collection, query, where } from "firebase/firestore";

import type { RemoteSubscriptionProps } from "@/shared/api";
import { db } from "@/shared/firebase";
import { subscribeReads } from "@/shared/firestore";
import { convertCardDtoToCard } from "./dto";

export const subscribeCardReads = (props: RemoteSubscriptionProps<Card>): (() => void) =>
  subscribeReads({
    query: query(collection(db, "card"), where("uid", "==", props.uid)),
    mapDocument: convertCardDtoToCard,
    isActive: (card) => card.deletedAt === null,
    onSnapshot: props.onSnapshot,
    onError: props.onError,
  });
