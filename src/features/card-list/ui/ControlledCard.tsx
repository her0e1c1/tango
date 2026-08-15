import React from "react";
import { Card } from "./Card";

export const ControlledCard: React.FC<React.ComponentProps<typeof Card>> = (props) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  return (
    <Card
      {...props}
      menuOpen={menuOpen}
      onToggleMenu={(id) => {
        props.onToggleMenu?.(id);
        setMenuOpen((value) => !value);
      }}
      onCloseMenu={() => setMenuOpen(false)}
    />
  );
};
