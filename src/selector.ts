import * as C from 'src/constant';

export const getSelector = (state: RootState) => new Selector(state);

type ModelKey = 'deck' | 'card' | 'sheet';
class Model {
  constructor(public id: string, selector: Selector) {}
}

class Selector {
  state: RootState;
  card: CardSelector;
  deck: DeckSelector;
  sheet: SheetSelector;
  constructor(state: RootState) {
    this.state = state;
    this.card = new CardSelector(this);
    this.deck = new DeckSelector(this);
    this.sheet = new SheetSelector(this);
  }
}

abstract class EntitySelector<
  IEntity extends Card | Deck | Sheet,
  OEntity extends Model & IEntity
> {
  key: ModelKey;
  model?: typeof Model;
  constructor(public selector: Selector) {}

  getByIdFromReducer(id: string): IEntity | undefined {
    return this.selector.state[this.key].byId[id] as IEntity;
  }

  getById(id: string): OEntity | undefined {
    const e = this.getByIdFromReducer(id);
    if (!e) return;
    else if (this.model) return new this.model(e.id, this.selector) as OEntity;
    else return e as OEntity;
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

class DeckSelector extends EntitySelector<Deck, _DeckModel> {
  key: ModelKey = 'deck';
  model = _DeckModel;
  get mine(): _DeckModel[] {
    return this.selector.deck
      .all()
      .filter(d => d.uid === this.selector.state.config.uid);
  }
  get public(): _DeckModel[] {
    return this.selector.deck.all().filter(d => d.isPublic);
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
  get current(): _DeckModel {
    const r = this.getCurrentPage();
    const deckId = r && r.params && r.params.deckId;
    return this.getByIdOrEmpty(deckId);
  }
}

class CardSelector extends EntitySelector<Card, _CardModel> {
  key: ModelKey = 'card';
  model = _CardModel;
  deckId(deckId: string): _CardModel[] {
    const deck = this.selector.deck.getById(deckId);
    if (!deck) {
      return [];
    }
    return deck.cardIds
      .map(id => this.getById(id))
      .filter(c => !!c) as _CardModel[];
  }
  get currentList() {
    const deckId = this.selector.deck.current.id;
    if (!deckId) return [];
    return this.filter({ deckId });
  }
  get currentCard(): _CardModel {
    const cards = this.selector.card.currentList;
    const deck = this.selector.deck.current;
    if (deck.currentIndex >= 0) {
      return cards[deck.currentIndex];
    }
    return {} as _CardModel;
  }

  filter(props: { deckId?: string; mastered?: boolean }): _CardModel[] {
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

interface _DeckModel extends Deck {}
class _DeckModel implements Model {
  constructor(public id: string, public selector: Selector) {
    this.selector = selector;
    const deck = selector.deck.getByIdFromReducer(id);
    if (!deck) {
      throw 'No deck';
    }
    Object.assign(this, deck);
  }
  toJSON(deck?: Partial<Deck>): Deck {
    const keys = [
      'id',
      'uid',
      'cardIds',
      'createdAt',
      'updatedAt',
      'name',
      'isPublic',
      'deletedAt',
      'currentIndex',
      'category',
      'url',
    ];
    const json = {} as Deck;
    keys.forEach(key => {
      let val = this[key];
      if (deck) {
        val = deck[key];
      }
      if (val !== undefined) {
        json[key] = val;
      }
    });
    return json;
  }
}
// FIXME: can not export _DeckModel
export const DeckModel = _DeckModel;

interface _CardModel extends Card {}
class _CardModel implements Model {
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
  get deck(): _DeckModel {
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
  toJSON(card?: Partial<Card>): Card {
    const keys = [
      'id',
      'uid',
      'frontText',
      'backText',
      'hint',
      'mastered',
      'deckId',
      'tags',
      'createdAt',
      'updatedAt',
    ];
    const json = {} as Card;
    keys.forEach(key => {
      let val = this[key];
      if (card) {
        val = card[key];
      }
      if (val !== undefined) {
        json[key] = val;
      }
    });
    return json;
  }
}
// FIXME: can not export _CardModel
export const CardModel = _CardModel;

class SheetSelector extends EntitySelector<Sheet, Sheet> {
  key: ModelKey = 'sheet';
}
