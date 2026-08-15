import React from "react";
import { CardActionsMenu } from "./CardActionsMenu";

type Props = Omit<React.ComponentProps<typeof CardActionsMenu>, "open" | "onToggle" | "onClose">;

export const ControlledCardActionsMenu: React.FC<Props> = (props) => {
  const [open, setOpen] = React.useState(false);
  return (
    <CardActionsMenu
      {...props}
      open={open}
      onToggle={() => setOpen((value) => !value)}
      onClose={() => setOpen(false)}
    />
  );
};
