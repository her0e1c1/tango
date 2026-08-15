import React from "react";

import { cards } from "@/storybook/fixture";
import { CardListView } from "./CardListView";

export const RemovableSelectedTagsExample: React.FC<{
  onRemoveTag: React.ComponentProps<typeof CardListView>["onRemoveTag"];
}> = (props) => {
  const [selectedTags, setSelectedTags] = React.useState(["TypeScript", "Accessibility"]);
  return (
    <CardListView
      cards={cards.default}
      filter={{ scoreMin: null, scoreMax: null, selectedTags }}
      onRemoveTag={(tag) => {
        props.onRemoveTag?.(tag);
        setSelectedTags((values) => values.filter((value) => value !== tag));
      }}
    />
  );
};

export const ClosableCardViewExample: React.FC<React.ComponentProps<typeof CardListView>> = (props) => {
  const { overlay: initialOverlay, ...rest } = props;
  const [overlay, setOverlay] = React.useState(initialOverlay);

  return (
    <CardListView
      {...rest}
      {...(overlay !== undefined
        ? {
            overlay: {
              ...overlay,
              onClose: () => {
                overlay.onClose?.();
                setOverlay(undefined);
              },
            },
          }
        : {})}
    />
  );
};
