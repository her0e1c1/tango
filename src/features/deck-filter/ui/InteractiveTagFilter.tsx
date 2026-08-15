import React from "react";

import { TagFilter } from "./TagFilter";

export const InteractiveTagFilter: React.FC<React.ComponentProps<typeof TagFilter>> = (props) => {
  const [selectedTags, setSelectedTags] = React.useState(props.selectedTags ?? []);

  return (
    <TagFilter
      {...props}
      selectedTags={selectedTags}
      onClickTag={(tags) => {
        props.onClickTag?.(tags);
        setSelectedTags(tags);
      }}
    />
  );
};
