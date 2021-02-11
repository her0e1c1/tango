import { ThunkResult } from "./index";
import { pull, shuffle } from "lodash";
import * as RN from "react-native";
import * as Papa from "papaparse";
import { ThunkAction } from "redux-thunk";
import * as C from "src/constant";
import * as type from "src/action/type";
import { db } from "src/firebase";
import moment from "moment";
import * as firebase from "firebase";

export const create = (
    deck: Pick<Deck, "name" | "sheetId" | "url">,
    cards: Omit<Card, "id" | "createdAt">[]
): ThunkResult => async (dispatch, getState) => {
    if (cards.length > 200) {
        alert("You can not create a deck with more than 200 cards");
        return;
    }
    const uid = getState().config.uid;
    const createdAt = firebase.firestore.FieldValue.serverTimestamp();
    const updatedAt = createdAt;
    const batch = db.batch();
    const docDeck = db.collection("deck").doc();
    const cardIds = [] as string[];
    const insertedCards = [] as any[]; // TODO: fix any
    cards.forEach((c) => {
        const doc = db.collection("card").doc();
        cardIds.push(doc.id);
        const card = {
            ...c,
            id: doc.id,
            deckId: docDeck.id,
            uid,
            createdAt,
            updatedAt,
        };
        batch.set(doc, card);
        insertedCards.push(card);
    });
    const d = {
        ...deck,
        id: docDeck.id,
        uid,
        createdAt,
        updatedAt,
        cardIds,
        scoreMax: null,
        scoreMin: null,
        sheetId: deck.sheetId || null,
        url: deck.url || null,
        isPublic: false,
        deletedAt: null,
    } as any; // TODO: fix any
    batch.set(docDeck, d);
    if (uid) await batch.commit(); // not login mode
    await dispatch(type.deckInsert(d));
    await dispatch(type.cardBulkInsert(insertedCards));
};

export const update = (
    deck: Partial<Deck> & { id: string }
): ThunkResult => async (dispatch, getState) => {
    dispatch(type.deckUpdate(deck));
    if (!getState().config.uid) return; // not login mode
    if (!deck.uid) return; // imported public deck
    db.collection("deck")
        .doc(deck.id)
        .update({
            ...deck,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
};

export const edit = (): ThunkResult => async (dispatch, getState) => {
    const edit = getState().deck.edit;
    await dispatch(update(edit));
};

// For deck, using soft delete flag with deletedAt
// here update updatedAt, deletedAt and cardIds in deck.
export const remove = (deckId: string): ThunkResult => async (dispatch, getState) => {
    const deck = getState().deck.byId[deckId];
    if (!deck.uid) {
        // not imported public deck
        dispatch(type.deckDelete(deckId));
        return;
    }
    const uid = getState().config.uid;
    const batch = db.batch();
    const querySnapshot = await db
        .collection("card")
        .where("uid", "==", uid)
        .where("deckId", "==", deckId)
        .get();
    querySnapshot.forEach((doc) => batch.delete(doc.ref));
    const doc = db.collection("deck").doc(deckId);
    batch.update(doc, {
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        deletedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    if (uid) await batch.commit(); // not login mode
    dispatch(type.deckDelete(deckId));
};

export const start = (cards: Card[]): ThunkResult => async (
    dispatch,
    getState
) => {
    const deckId = cards[0].deckId; // caller cares!
    const config = getState().config;
    let cardOrderIds = cards.map((c) => c.id);
    if (config.shuffled) {
        cardOrderIds = shuffle(cardOrderIds);
    }
    if (config.maxNumberOfCardsToLearn > 0) {
        cardOrderIds = cardOrderIds.slice(0, config.maxNumberOfCardsToLearn);
    }
    await dispatch(update({ id: deckId, currentIndex: 0, cardOrderIds }));
    await dispatch(
        type.configUpdate({
            showBackText: false,
            autoPlay: config.defaultAutoPlay,
        })
    );
};

export const pubicFetch = (): ThunkResult => async (dispatch, getState) => {
    const query = db
        .collection("deck")
        .where("deletedAt", "==", null)
        .where("isPublic", "==", true);
    // .orderBy('updatedAt', 'desc');
    let querySnapshot: firebase.firestore.QuerySnapshot;
    querySnapshot = await query.get();
    const decks = [] as Deck[];
    querySnapshot.forEach((doc) => {
        const d = doc.data() as Deck;
        decks.push({ ...d, id: doc.id });
    });
    await dispatch(type.deckPublicBulkInsert(decks));
};

export const publicImport = (deckId: string): ThunkResult => async (
    dispatch,
    getState
) => {
    // no need to filter by public deck?
    // where('deck.isPublic', '==', true)
    const querySnapshot = await db
        .collection("card")
        .where("deckId", "==", deckId)
        .get();
    const cards = [] as Card[];
    querySnapshot.forEach((doc) => {
        const d = doc.data() as Card;
        cards.push({ ...d, id: doc.id });
    });

    const querySnapshot2 = await db
        .collection("deck")
        .where("id", "==", deckId)
        .where("isPublic", "==", true)
        .get();
    querySnapshot2.forEach((doc) => {
        const d = doc.data() as Deck;
        dispatch(type.deckInsert({ ...d, uid: "" }));
    });

    await dispatch(type.cardBulkInsert(cards));
};