import * as RN from 'react-native';
import styled from 'styled-components';

export const Container = styled(RN.View)`
  flex: 1;
  background-color: ${({ theme }: AppContext) => theme.mainBackgroundColor};
  padding-top: 20; /* space for ios status bar */
  padding: 10px 0px;
`;

export const DeckCard = styled(RN.View)`
  padding: 15px;
  background-color: ${({ theme }: AppContext) => theme.cardBackgroundColor};
  border-style: solid;
  border-color: ${({ theme }: AppContext) => theme.cardBorderColor};
  border-width: 1px;
`;

export const DeckTitle = styled(RN.Text)`
  color: ${({ theme }: AppContext) => theme.mainColor};
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 5px;
`;

export const CardCategory = styled(RN.Text)`
  border-width: 1px;
  border-color: ${({ theme }: AppContext) => theme.titleColor};
  color: ${({ theme }: AppContext) => theme.mainColor};
  font-weight: bold;
  font-size: 16px;
  border-radius: 10px;
  padding: 5px;
`;

export const SettingsItem = styled(RN.View)`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  background-color: ${({ theme }: AppContext) => theme.cardBackgroundColor};
  padding: 10px;
  border-bottom-width: 1px;
  border-style: solid;
`;

export const SettingsText = styled(RN.Text)`
  color: ${({ theme }: AppContext) => theme.mainColor};
  font-size: 16;
`;

export const CardCard = styled(RN.View)`
  flex-direction: row;
  align-items: center;
  background-color: ${({ theme }: AppContext) => theme.cardBackgroundColor};
  border-style: solid;
  border-bottom-width: 1px;
`;

export const CardTitle = styled(RN.Text)`
  color: ${({ theme }: AppContext) => theme.mainColor};
  font-size: 13px;
`;

export const SideControl = styled(RN.TouchableOpacity)`
  top: 0;
  width: 100;
  z-index: 1;
  position: absolute;
  background-color: rgba(0, 0, 0, 0);
`;

export const CardViewDetail = styled(RN.Text)`
  font-size: 25;
  color: ${({ theme }: AppContext) => theme.mainColor};
  text-align: center;
`;

// If you use flex:1, height will be out of screen ...
export const CardContainer = styled(RN.View)`
  background-color: ${({ theme }: AppContext) => theme.cardBackgroundColor};
`;
