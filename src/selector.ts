import * as C from 'src/constant';

export const getSelector = (state: RootState) => new Selector(state);

type ModelKey = 'deck' | 'card';
class Model {
  constructor(public id: string, selector: Selector) {}
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
  // native method
  getCurrentPage(): NavState | undefined {
    const state = this.selector.state;
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
  }
  get current(): DeckModel {
    const r = this.getCurrentPage();
    const deckId = r && r.params && r.params.deckId;
    return this.getByIdOrEmpty(deckId);
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
      .map(id => this.getById(id))
      .filter(c => !!c) as CardModel[];
  }
  get currentList() {
    const deckId = this.selector.deck.current.id;
    if (!deckId) return [];
    return this.filter({ deckId });
  }
  get currentCard(): CardModel {
    const cards = this.selector.card.currentList;
    const deck = this.selector.deck.current;
    if (deck.currentIndex >= 0) {
      return cards[deck.currentIndex];
    }
    return {} as CardModel;
  }

  filter(props: { deckId?: string; mastered?: boolean }): CardModel[] {
    let { deckId, mastered } = props;
    if (!deckId) {
      return this.all();
    }
    const cards = this.deckId(deckId);
    const tags = this.selector.state.config.selectedTags;
    return cards.filter(c => {
      if (tags.length > 0 && !tags.some(t => c.tags.includes(t))) {
        return false;
      }
      if (mastered !== undefined) {
        if (mastered === true && c.mastered) {
          return false;
        }
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
    const card = selector.card.getByIdFromReducer(id);
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
    // TODO: remove
    const convert = c => {
      if (c === 'hs') return 'haskell';
      if (c === 'go') return 'golang';
      return c;
    };
    const categories = this.tags.concat([this.deck.category || '']);
    for (let c of categories) {
      c = convert(c);
      if (C.CATEGORY.includes(c)) return c;
    }
    const c = this.tags.length > 0 ? this.tags[0] : this.deck.category;
    return c;
  }
}
