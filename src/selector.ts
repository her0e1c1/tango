export const getSelector = (state: RootState) => new Selector(state);

type ModelKey = 'deck' | 'card';
class Model {
  constructor(id: string, selector: Selector) {}
}
class Selector {
  state: RootState;
  card: CardSelector;
  deck: DeckSelector;
  constructor(state: RootState) {
    this.state = state;
    this.card = new CardSelector(this);
    this.deck = new DeckSelector(this);
  }
}

abstract class EntitySelector<
  IEntity extends Card | Deck,
  OEntity extends Model & IEntity
> {
  key: ModelKey;
  model: typeof Model;
  constructor(public selector: Selector) {}

  getByIdFromReducer(id: string): IEntity | undefined {
    return this.selector.state[this.key].byId[id] as IEntity;
  }

  getById(id: string): OEntity | undefined {
    const e = this.getByIdFromReducer(id);
    return e && (new this.model(e.id, this.selector) as OEntity);
  }

  getByIdOrEmpty(id: string): OEntity {
    // defensive programming
    // even if invalid data, still try to return entity
    return this.getById(id) || ({} as OEntity);
  }

  all(): OEntity[] {
    return Object.keys(this.selector.state[this.key].byId).map(id =>
      this.getByIdOrEmpty(id)
    );
  }
}

class DeckSelector extends EntitySelector<Deck, DeckModel> {
  key: ModelKey = 'deck';
  model = DeckModel;
  get mine(): DeckModel[] {
    return this.selector.deck
      .all()
      .filter(d => d.uid === this.selector.state.config.uid);
  }
  get public(): DeckModel[] {
    return this.selector.deck
      .all()
      .filter(d => d.uid !== this.selector.state.config.uid);
  }
}

class CardSelector extends EntitySelector<Card, CardModel> {
  key: ModelKey = 'card';
  model = CardModel;
  deckId(deckId: string): CardModel[] {
    const deck = this.selector.deck.getById(deckId);
    if (!deck) {
      return [];
    }
    return deck.cardIds
      .map(id => this.selector.card.getById(id))
      .filter(c => !!c) as CardModel[];
  }
  filter(deckId: string): CardModel[] {
    const cards = this.deckId(deckId);
    const tags = this.selector.state.config.selectedTags;
    return cards.filter(c => {
      if (tags.length > 0 && !tags.some(t => c.tags.includes(t))) {
        return false;
      }
      if (c.deckId !== deckId) {
        return false;
      }
      return true;
    });
  }
}

// prevent interface re-declaration
// https://github.com/Microsoft/TypeScript/issues/340#issuecomment-184964440

interface DeckModel extends Deck {}
class DeckModel implements Model {
  constructor(public id: string, public selector: Selector) {
    this.selector = selector;
    const deck = selector.deck.getByIdFromReducer(id);
    if (!deck) {
      throw 'No deck';
    }
    Object.assign(this, deck);
  }
}

interface CardModel extends Card {}
class CardModel implements Model {
  constructor(public id: string, public selector: Selector) {
    this.selector = selector;
    const card = selector.card.getById(id);
    if (!card) {
      throw 'No deck';
    }
    Object.assign(this, card);
    if (!this.deck) {
      throw 'No deck';
    }
  }
  get deck(): Deck {
    return this.selector.deck.getById(this.deckId)!;
  }
  get category(): string | undefined {
    return this.tags.length > 0 ? this.tags[0] : this.deck.category;
  }
}

export const getDecks = (
  state: RootState,
  isPublic: boolean = false
): Deck[] => {
  if (isPublic) {
    return Object.values(state.deck.byId).filter(
      d => d.uid != state.config.uid
    );
  } else {
    return Object.values(state.deck.byId).filter(
      d => d.uid == state.config.uid
    );
  }
};

export const getCurrentPage = (state: RootState): NavState | undefined => {
  const i = state.nav.index;
  const r = state.nav.routes;
  if (r) {
    const i2 = r[i].index;
    const r2 = r[i].routes;
    if (r2) {
      return r2[i2];
    }
  }
  return undefined;
};

export const getCurrentDeck = (state: RootState): Deck => {
  const r = getCurrentPage(state);
  const deckId = r && r.params && r.params.deckId;
  return state.deck.byId[deckId] || {};
};

export const getCardList = (state: RootState, deckId: string) => {
  const all = state.deck.byId[deckId].cardIds || [];
  return all.map(id => state.card.byId[id]);
};

export const getCurrentCard = (state: RootState): Card => {
  const cards = getCurrentCardList(state);
  const deck = getCurrentDeck(state);
  if (deck.currentIndex >= 0) {
    return cards[deck.currentIndex];
  }
  return {} as Card;
};
export const getCurrentCardList = (state: RootState): Card[] => {
  const config = state.config;
  const deckId = getCurrentDeck(state).id;
  if (deckId) {
    const cards = getCardList(state, deckId)
      .filter(c => !!c) // defensive
      .filter(c => {
        if (config.showMastered) {
          return true;
        } else {
          return !c.mastered;
        }
      });
    return cards;
  } else {
    return [];
  }
};
