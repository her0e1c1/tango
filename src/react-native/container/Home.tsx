import { createStackNavi } from 'src/react-native/component';
import { DeckListPage } from './DeckList';
import { CardListPage } from './CardList';
import { DeckSwiperPage } from './DeckSwiper';
import { DeckStartPage } from './DeckStart';
import { DeckEditPage } from './DeckEdit';
import { CardEditPage } from './CardEdit';

export const HomePage = createStackNavi({
  DeckList: DeckListPage,
  CardList: CardListPage,
  DeckSwiper: DeckSwiperPage,
  DeckStart: DeckStartPage,
  DeckEdit: DeckEditPage,
  CardEdit: CardEditPage,
});
