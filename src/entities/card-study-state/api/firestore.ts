import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/shared/firebase";
import { replaceCardStudyStates } from "../model/actions/replaceCardStudyStates";
import { cardStudyStateStore } from "../model/store";
import { parseCardStudyState } from "./document";

export function subscribeCardStudyStates(uid: string, onError: (error: Error) => void, onReady: () => void) {
  const report = (error: Error) => {
    cardStudyStateStore.setState({ error });
    onError(error);
  };
  return onSnapshot(
    query(collection(db, "cardStudyState"), where("uid", "==", uid)),
    (snapshot) => {
      try {
        const states = snapshot.docs.map((document) => parseCardStudyState(document.id, document.data()));
        if (states.some((state) => state.uid !== uid)) throw new Error("Card study state owner does not match");
        replaceCardStudyStates(states);
        onReady();
      } catch (cause) {
        report(cause instanceof Error ? cause : new Error(String(cause)));
      }
    },
    report
  );
}
