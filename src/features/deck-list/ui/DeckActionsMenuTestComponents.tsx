import React from "react";
import { DeckActionsMenu } from "./DeckActionsMenu";

type Props = Omit<React.ComponentProps<typeof DeckActionsMenu>, "open" | "onToggle" | "onClose">;

export const ControlledDeckActionsMenu: React.FC<Props> = (props) => {
  const [open, setOpen] = React.useState(false);
  return (
    <DeckActionsMenu
      {...props}
      open={open}
      onToggle={() => setOpen((value) => !value)}
      onClose={() => setOpen(false)}
    />
  );
};

export const DisableableDeckActionsMenu = () => {
  const [open, setOpen] = React.useState(false);
  const [disabled, setDisabled] = React.useState(false);
  return (
    <>
      <button type="button" onClick={() => setDisabled((value) => !value)}>
        Toggle disabled
      </button>
      <DeckActionsMenu
        deckName="Physics"
        open={open}
        disabled={disabled}
        onToggle={() => setOpen((value) => !value)}
        onClose={() => setOpen(false)}
      />
    </>
  );
};
