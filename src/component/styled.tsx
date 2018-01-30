import * as RN from 'react-native';
import styled from 'styled-components';

export const Container = styled(RN.View)`
  flex: 1;
  background-color: ${({ theme }: AppContext) => theme.mainBackgroundColor};
  padding-top: 20; /* space for ios status bar */
  padding-horizontal: 10px;
`;

export const DeckCard = styled(RN.View)`
  padding: 20px;
  background-color: ${({ theme }: AppContext) => theme.cardBackgroundColor};
  border-style: solid;
  border-width: 0px;
`;

export const DeckTitle = styled(RN.Text)`
  color: ${({ theme }: AppContext) => theme.mainColor};
  font-weight: bold;
  font-size: 20px;
`;

export const SettingsItem = styled(RN.View)`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  background-color: ${({ theme }: AppContext) => theme.cardBackgroundColor};
  padding: 10px 10px;
  border-bottom-width: 1px;
  border-style: solid;
`;

export const SettingsText = styled(RN.Text)`
  color: ${({ theme }: AppContext) => theme.mainColor};
  font-size: 16;
`;
