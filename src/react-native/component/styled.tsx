import * as React from 'react';
import * as RN from 'react-native';
import * as styledComponents from 'styled-components';
import { ThemedStyledComponentsModule } from 'styled-components';
import { TabBarBottom as _TabBarBottom } from 'react-navigation';

const {
  default: styled,
  withTheme,
} = styledComponents as ThemedStyledComponentsModule<Theme>;

// FIXME: wait for this syntax to be available: styled(RN.View)<Props>`...`
const View = props => <RN.View {...props} />;

export const ProgressBar = styled(View as React.SFC<{ width: string }>)`
  height: 20;
  width: ${props => props.width};
  background-color: ${props => props.theme.masteredColor};
`;

export const BodyText = styled(RN.Text)`
  color: ${({ theme }) => theme.mainColor};
  font-size: 16px;
  padding: 0 5px;
`;

export const Container = styled(RN.View)`
  flex: 1;
  background-color: ${({ theme }) => theme.mainBackgroundColor};
  padding-top: 20; /* space for ios status bar */
  padding-left: 10px;
  padding-right: 10px;
`;

export const DeckCard = styled(RN.View)`
  padding: 15px;
  background-color: ${({ theme }) => theme.cardBackgroundColor};
  border-style: solid;
  border-color: ${({ theme }) => theme.cardBorderColor};
  border-width: 1px;
`;

export const DeckTitle = styled(RN.Text)`
  color: ${({ theme }) => theme.mainColor};
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 5px;
`;

export const CardCategory = styled(RN.Text)`
  border-width: 1px;
  border-color: ${({ theme }) => theme.titleColor};
  color: ${({ theme }) => theme.mainColor};
  font-weight: bold;
  font-size: 16px;
  border-radius: 10px;
  padding: 5px;
`;

export const CardListItem = styled(RN.View)`
  flex-direction: row;
  align-items: center;
  background-color: ${({ theme }) => theme.cardBackgroundColor};

  border-style: solid;
  border-color: #c9c9c9;
  border-bottom-width: 1px;
`;

export const CardTitle = styled(RN.Text)`
  color: ${({ theme }) => theme.mainColor};
  font-size: 12px;
`;

export const SideControl = styled(RN.TouchableOpacity)`
  top: 0;
  width: 100;
  z-index: 1;
  position: absolute;
  background-color: rgba(0, 0, 0, 0);
`;

export const TabBarBottom = styled(_TabBarBottom)`
  background-color: ${({ theme }) => theme.cardBackgroundColor};
`;

export const Button = withTheme<RN.ButtonProperties & { theme: Theme }>(
  ({ theme, ...rest }) => <RN.Button {...rest} color={theme.mainColor} />
);