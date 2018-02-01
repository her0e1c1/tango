import * as React from 'react';
import * as RN from 'react-native';
import { connect } from 'react-redux';
import * as I from 'src/interface';

const getAllCards = (state: RootState, deck_id: number) => {
  const allCardIds = state.card.byDeckId[deck_id] || [];
  return allCardIds.map(id => state.card.byId[id]);
};

class ProgressBar extends React.Component<Props & { deck_id?: number }, {}> {
  render() {
    if (!this.props.state.config.showHeader) {
      return null;
    }
    const { deck } = this.props.state.nav;
    const deck_id = this.props.deck_id || (deck && deck.id);
    if (!deck_id) {
      return null;
    }
    const index = this.props.state.nav.index
      ? `(${this.props.state.nav.index})`
      : '';
    const cards = getAllCards(this.props.state, deck_id);
    const mastered = cards.filter(x => !!x && x.mastered);
    const width = cards.length > 0 ? mastered.length / cards.length * 100 : 0;
    return (
      <RN.View
        style={{
          height: 20,
          backgroundColor: 'silver',
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <RN.View
          style={{
            height: 20,
            width: `${width}%`,
            backgroundColor: 'green',
          }}
        />
        <RN.View
          style={{
            flex: 1,
            position: 'absolute',
            left: 0,
            right: 0,
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0)',
            paddingRight: 5,
          }}
        >
          <RN.Text
            style={{
              fontSize: 13,
              fontWeight: 'bold',
            }}
          >{`${mastered.length}/${cards.length}${index}`}</RN.Text>
        </RN.View>
      </RN.View>
    );
  }
}

const mapStateToProps = (state: RootState) => ({ state });
const _mapStateToProps = I.returntypeof(mapStateToProps);
const mapDispatchToProps = {};
type Props = typeof _mapStateToProps & typeof mapDispatchToProps;
export default connect(mapStateToProps, mapDispatchToProps)(ProgressBar);
