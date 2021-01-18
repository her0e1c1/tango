import * as React from "react";
import * as RN from "react-native";
import DeckSwiperLib from "react-native-deck-swiper";
import { useDimension } from "src/react-native/hooks/action";

export const DeckSwiper = (props: {
  ids: string[];
  deckCurrentIndex: number;
  renderCard: (id: string) => React.ReactElement;
  swipeLeft?: Callback;
  swipeTop?: Callback;
  swipeRight?: Callback;
  swipeDown?: Callback;
  color?: string;
  goBackLeft?: boolean;
  goBackTop?: boolean;
  goBackRight?: boolean;
  goBackDown?: boolean;
  onPress?: Callback;
}) => {
  const { width, height } = useDimension();
  const [dimension, setDimension] = React.useState({
    width,
    height: height - 60,
  }); // 20 == height of Header + Controller
  return (
    <RN.View
      style={{ flex: 1 }}
      onLayout={(e) =>
        setDimension({
          height: e.nativeEvent.layout.height,
          width: e.nativeEvent.layout.width,
        })
      }
    >
      <DeckSwiperLib
        /* I think DeckSwiper position is absolute */
        cardIndex={props.deckCurrentIndex || 0}
        cards={props.ids || []}
        cardStyle={{ height: dimension.height, width }}
        cardHorizontalMargin={0}
        cardVerticalMargin={0}
        marginBottom={0}
        zoomFriction={0}
        backgroundColor={props.color || "white"}
        disableBottomSwipe={false}
        showSecondCard={false}
        swipeAnimationDuration={100}
        onTapCard={props.onPress}
        onSwipedLeft={props.swipeLeft}
        onSwipedTop={props.swipeTop}
        onSwipedRight={props.swipeRight}
        onSwipedBottom={props.swipeDown}
        goBackToPreviousCardOnSwipeLeft={props.goBackLeft}
        goBackToPreviousCardOnSwipeTop={props.goBackTop}
        goBackToPreviousCardOnSwipeRight={props.goBackRight}
        goBackToPreviousCardOnSwipeDown={props.goBackDown}
        // even if shouldComponentUpdate in <DeckSwiperLib /> is true, _id is previous ID of card
        renderCard={(_id) =>
          props.renderCard(props.ids[props.deckCurrentIndex])
        }
      />
    </RN.View>
  );
};
