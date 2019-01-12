import * as React from 'react';
import * as RN from 'react-native';
import * as styledComponents from 'styled-components';
import { ThemedStyledComponentsModule } from 'styled-components';
import { TabBarBottom as _TabBarBottom } from 'react-navigation';

const { default: styled } = styledComponents as ThemedStyledComponentsModule<
  Theme
>;

// FIXME: wait for this syntax to be available: styled(RN.View)<Props>`...`
const View = props => <RN.View {...props} />;

export const ProgressBar = styled(View as React.SFC<{ width: string }>)`
  height: 20;
  width: ${props => props.width};
  background-color: ${props => props.theme.masteredColor};
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

export const TabBarBottom = styled(_TabBarBottom)`
  background-color: ${({ theme }) => theme.cardBackgroundColor};
`;
