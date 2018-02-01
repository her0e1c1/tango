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
  border-color: ${({ theme }: AppContext) => theme.cardBorderColor};
  border-width: 1px;
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

export const Circle = styled(RN.View)`
  background-color: ${({ theme, mastered }: AppContext) =>
    mastered ? 'green' : theme.circleBackgroundColor};
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border-width: 1px;
  border-style: solid;
`;

export const CardCard = styled(RN.View)`
  flex-direction: row;
  align-items: center;
  background-color: ${({ theme }: AppContext) => theme.cardBackgroundColor};
  border-style: solid;
  border-width: 1px;
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

export const CardContainer = styled(RN.View)`
  flex: 1;
  background-color: ${({ theme }: AppContext) => theme.cardBackgroundColor};
`;
