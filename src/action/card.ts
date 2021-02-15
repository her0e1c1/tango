
import { pull, shuffle } from "lodash";
import * as RN from "react-native";
import * as firebase from "firebase";
import * as Papa from "papaparse";
import { ThunkAction } from "redux-thunk";
import * as C from "src/constant";
import * as type from "src/action/type";
import { db } from "src/firebase";
import moment from "moment";
import { ThunkResult } from "./index";

export const update = (card: Partial<Card> & { id: string }): ThunkResult => async (
    dispatch,
    getState
) => {
    dispatch(type.cardUpdate(card));
    if (!getState().config.uid) return; // not login mode
    await db
        .collection("card")
        .doc(card.id)
        .update({
            ...card,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
};

export const edit = (): ThunkResult => async (dispatch, getState) => {
    const edit = getState().card.edit;
    await dispatch(update(edit));
};

// TODO: not login mode
export const remove = (id: string): ThunkResult => async (dispatch, getState) => {
    const card = getState().card.byId[id];
    __DEV__ && console.log("CARD DELETED", card.id, card.deckId);
    const deckRef = db.collection("deck").doc(card.deckId);
    const cardRef = db.collection("card").doc(id);
    // NOTE: once a deck notified, need to delete the card which belongs to it
    await db.runTransaction(async (t) => {
        const deckDoc = await t.get(deckRef);
        const deck = deckDoc.data() as Deck;
        const cardIds = pull(deck.cardIds, id);
        await t.update(deckRef, {
            cardIds,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        await t.delete(cardRef);
    });
};
