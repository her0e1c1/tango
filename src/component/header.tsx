import styled from 'styled-components';
import * as React from 'react';
import * as RN from 'react-native';
import { connect } from 'react-redux';
import * as Action from 'src/action';
import * as I from 'src/interface';
import * as SD from './styled';
import { withTheme } from 'styled-components';
import { withNavigation } from 'react-navigation';

const MainText = styled(RN.Text)`
  color: ${({ theme }: AppContext) => theme.titleColor};
  font-size: 18px;
`;

@withTheme
@withNavigation
export class Header extends React.Component<Props, {}> {
  render() {
    const { state } = this.props;
    if (!state.config.showHeader) {
      return <RN.View />;
    }
    const showBackButton = this.props.state.nav.routes.length > 1;
    const card = Action.getCurrentCard(state);
    const deck = Action.getCurrentDeck(state);
    return (
      <RN.View style={{ marginBottom: 10 }}>
        <RN.View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 5,
          }}
        >
          <RN.View style={{ flexDirection: 'row' }}>
            <MainText>TANGO {deck && deck.name && `[${deck.name}]`}</MainText>
            {card &&
              card.category && (
                <SD.CardCategory>{card.category}</SD.CardCategory>
              )}
          </RN.View>
          {showBackButton && (
            <RN.TouchableOpacity
              onPress={() => this.props.navigation.goBack()}
              onLongPress={() => this.props.goHome()}
            >
              <MainText>{'< BACK'}</MainText>
            </RN.TouchableOpacity>
          )}
        </RN.View>
      </RN.View>
    );
  }
}

const mapStateToProps = (state: RootState) => ({ state });
const _mapStateToProps = I.returntypeof(mapStateToProps);
const mapDispatchToProps = { goHome: Action.goHome };
type Props = typeof _mapStateToProps & typeof mapDispatchToProps;
export default connect(mapStateToProps, mapDispatchToProps)(Header);
