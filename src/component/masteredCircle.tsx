import * as React from 'react';
import * as RN from 'react-native';
import { connect } from 'react-redux';
import * as Action from 'src/action';
import * as I from 'src/interface';
import * as SD from './styled';

export class MasteredCircle extends React.Component<
  Props & { card: Card },
  {}
> {
  render() {
    const card = this.props.card;
    return (
      <RN.TouchableOpacity onPress={() => this.props.toggle(card)}>
        <SD.Circle style={{ margin: 5 }} mastered={card.mastered} />
      </RN.TouchableOpacity>
    );
  }
}

const mapStateToProps = (state: RootState) => ({ state });
const _mapStateToProps = I.returntypeof(mapStateToProps);
const mapDispatchToProps = {
  deleteCard: Action.deleteCard,
  toggle: Action.toggleMastered,
};
type Props = typeof _mapStateToProps & typeof mapDispatchToProps;
export default connect(mapStateToProps, mapDispatchToProps)(MasteredCircle);
