import * as RN from 'react-native';
import * as React from 'react';
import { useDispatch } from 'react-redux';

import { db, auth } from 'src/firebase';
import * as type from 'src/action/type';
import { useSelector, useConfigAttr } from './state';

// Is there a better way to unsubscribe?
export const UNSUBSCRIBES = [] as any[];
export const unsubscribeAll = () => {
  while (UNSUBSCRIBES.length !== 0) {
    const unsubscribe = UNSUBSCRIBES.pop();
    unsubscribe && unsubscribe();
  }
};

export const useClearAll = (clearStorage?: boolean) => {
  const dispatch = useDispatch();
  return async () => {
    clearStorage && (await RN.AsyncStorage.clear());
    await dispatch(type.clearAll());
    unsubscribeAll();
  };
};

export const useLogout = () => {
  const dispatch = useDispatch();
  return async () => {
    unsubscribeAll();
    auth.signOut();
    dispatch(type.clearAll());
  };
};

export const useSetEventListener = () => {
  const dispatch = useDispatch();
  const configUpdate = useConfigUpdate();
  const updatedAt = useSelector(
    (state: RootState) => state.config.lastUpdatedAt
  );
  return async (uid: string) => {
    // FIXME: maybe client timestamp is different from server's one
    __DEV__ && console.log('LAST UPDATED AT: ', new Date(updatedAt));
    const unsubscribeDeck = db
      .collection('deck')
      .where('uid', '==', uid)
      .where('updatedAt', '>=', new Date(updatedAt))
      .orderBy('updatedAt', 'desc')
      .onSnapshot(async snapshot => {
        __DEV__ && console.log('SNAPSHOT DECK: ');
        // it seems docChanges().forEach is not async func
        const decks = [] as Deck[];
        snapshot.docChanges().forEach(change => {
          const id = change.doc.id;
          const deck = { ...change.doc.data(), id } as Deck;
          // when initialized, modified event is not triggered but added is after updating deletedAt
          if (deck.deletedAt != null) {
            dispatch(type.deckDelete(id));
          } else if (change.type === 'added') {
            decks.push(deck);
          } else if (change.type === 'modified') {
            decks.push(deck);
          } else if (change.type === 'removed') {
            // NOT REACHED
          }
        });
        if (decks.length > 0) {
          await dispatch(type.deckBulkInsert(decks));
        }
        await configUpdate({ lastUpdatedAt: new Date().getTime() });
      });
    const unsubscribeCard = db
      .collection('card')
      .where('uid', '==', uid)
      .where('updatedAt', '>=', new Date(updatedAt))
      .orderBy('updatedAt', 'desc')
      .onSnapshot(async snapshot => {
        __DEV__ && console.log('SNAPSHOT CARD: ');
        const cards = [] as Card[];
        snapshot.docChanges().forEach(change => {
          const id = change.doc.id;
          const card = { ...change.doc.data(), id } as Card;
          if (change.type === 'added') {
            cards.push(card);
          } else if (change.type === 'modified') {
            cards.push(card);
          } else if (change.type === 'removed') {
            dispatch(type.cardDelete(id));
          }
        });
        if (cards.length > 0) {
          await dispatch(type.cardBulkInsert(cards));
        }
        configUpdate({ lastUpdatedAt: new Date().getTime() });
      });
    UNSUBSCRIBES.push(unsubscribeDeck);
    UNSUBSCRIBES.push(unsubscribeCard);
  };
};

export const useConfigUpdate = () => {
  const dispatch = useDispatch();
  return async (config: Partial<ConfigState>) =>
    dispatch(type.configUpdate(config));
};

export const useConfigUpdateInAdvance = (config: Partial<ConfigState>) => {
  const dispatch = useDispatch();
  return () => dispatch(type.configUpdate(config));
};

export const useIsLoading = (
  props: { isLoadingNoAction?: boolean } = {
    isLoadingNoAction: false,
  } as Partial<ConfigState>
) => {
  const dispatch = useDispatch();
  const isLoading = useConfigAttr('isLoading');
  return React.useMemo(
    () => ({
      isLoading,
      withLoading: async callback => {
        await dispatch(type.configUpdate({ isLoading: true }));
        try {
          await dispatch(callback);
        } catch (e) {
          await dispatch(type.error('UNKNOWN', e));
        } finally {
          await dispatch(type.configUpdate({ isLoading: false }));
        }
      },
      setLoading: async () =>
        await dispatch(type.configUpdate({ isLoading: true })),
      unsetLoading: async () =>
        await dispatch(type.configUpdate({ isLoading: false })),
    }),
    []
  );
};

export const useCardEdit = () => {
  const dispatch = useDispatch();
  return async (edit: Edit<Card>) => {
    dispatch(type.cardEdit(edit));
  };
};

export const useDeckEdit = () => {
  const dispatch = useDispatch();
  return async (edit: Edit<Deck>) => {
    dispatch(type.deckEdit(edit));
  };
};
