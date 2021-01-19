export const allIds: Select0<string[]> = () => state =>
    Object.keys(state.deck.byId);

export const getById: Select<{ deckId: number }, Deck> = props => state => {
    const deck = state.deck.byId[props.deckId];
    if (!deck) throw `NO DECK ${props.deckId}`;
    return deck;
};
