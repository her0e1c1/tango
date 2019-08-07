import {
  deck,
  deckInitialState,
  card,
  cardInitialState,
} from 'src/store/reducer';
import * as type from 'src/action/type';

describe('Test Reducer', () => {
  it('Deck Insert / Update / Delete', () => {
    const d = { id: '1', name: 'name' } as Deck;
    const s1 = deck(deckInitialState, type.deckInsert(d));
    expect(s1.byId[1].name).toBe('name');

    d.name = 'name2';
    const s2 = deck(s1, type.deckUpdate(d));
    expect(s2.byId[1].name).toBe('name2');

    const s3 = deck(s2, type.deckDelete(d.id));
    expect(s3.byId[1]).toBe(undefined);
  });

  it('Deck Bulk Insert / Update / Delete', () => {
    const d = { id: '1', name: 'name' } as Deck;
    const s1 = deck(deckInitialState, type.deckBulkInsert([d]));
    expect(s1.byId[1].name).toBe('name');

    d.name = 'name2';
    const s2 = deck(s1, type.deckBulkUpdate([d]));
    expect(s2.byId[1].name).toBe('name2');

    const s3 = deck(s2, type.deckBulkDelete([d.id]));
    expect(s3.byId[1]).toBe(undefined);
  });

  it('Card Insert / Update / Delete', () => {
    const c = { id: '1', frontText: 'text' } as Card;
    const s1 = card(cardInitialState, type.cardInsert(c));
    expect(s1.byId[1].frontText).toBe(c.frontText);

    c.frontText = 'text2';
    const s2 = card(s1, type.cardUpdate(c));
    expect(s2.byId[1].frontText).toBe('text2');

    const s3 = card(s2, type.cardDelete(c.id));
    expect(s3.byId[1]).toBe(undefined);
  });

  it('Card Bulk Insert / Update / Delete', () => {
    const c = { id: '1', frontText: 'text' } as Card;
    const s1 = card(cardInitialState, type.cardBulkInsert([c]));
    expect(s1.byId[1].frontText).toBe(c.frontText);

    c.frontText = 'text2';
    const s2 = card(s1, type.cardBulkUpdate([c]));
    expect(s2.byId[1].frontText).toBe('text2');

    const s3 = card(s2, type.cardBulkDelete([c.id]));
    expect(s3.byId[1]).toBe(undefined);
  });

  it('Delete a deck and the cards which belong to it', () => {
    const c = { id: '1', frontText: 'text', deckId: 'deckId1' } as Card;
    const s1 = card(cardInitialState, type.cardInsert(c));
    expect(s1.byId[1].frontText).toBe(c.frontText);

    const s2 = card(s1, type.deckDelete('deckId1'));
    expect(s2.byId[1]).toBe(undefined);
  });

  it('edit deck', () => {
    const d = { id: '1', name: 'name' } as Deck;
    const s1 = deck(deckInitialState, type.deckEdit(d));
    expect(s1.edit.name).toBe('name');

    d.name = 'name2';
    const s2 = deck(s1, type.deckEdit(d));
    expect(s2.edit.name).toBe('name2');
  });

  it('edit card', () => {
    const c = { id: '1', frontText: 'text' } as Card;
    const s1 = card(cardInitialState, type.cardEdit(c));
    expect(s1.edit.frontText).toBe('text');

    c.frontText = 'text2';
    const s2 = card(s1, type.cardEdit(c));
    expect(s2.edit.frontText).toBe('text2');
  });
});
