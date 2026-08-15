import React from "react";
import { ActionsMenu, type ActionsMenuItem } from "./ActionsMenu";

type ControlledProps = Omit<React.ComponentProps<typeof ActionsMenu>, "open" | "onToggle" | "onClose">;

export const ControlledActionsMenu: React.FC<ControlledProps> = (props) => {
  const [open, setOpen] = React.useState(false);
  return (
    <ActionsMenu {...props} open={open} onToggle={() => setOpen((value) => !value)} onClose={() => setOpen(false)} />
  );
};

export const SharedOpenMenus = ({
  labels,
  createItems,
}: {
  labels: { groupLabel: string; triggerLabel: string; menuLabel: string };
  createItems: () => ActionsMenuItem[];
}) => {
  const [openMenu, setOpenMenu] = React.useState<"first" | "second" | null>(null);
  const menu = (id: "first" | "second") => ({
    ...labels,
    groupLabel: `${id} ${labels.groupLabel}`,
    triggerLabel: `Open ${id} actions`,
    menuLabel: `${id} ${labels.menuLabel}`,
    items: createItems(),
    open: openMenu === id,
    onToggle: () => setOpenMenu((current) => (current === id ? null : id)),
    onClose: () => setOpenMenu(null),
  });
  return (
    <>
      <ActionsMenu {...menu("first")} />
      <ActionsMenu {...menu("second")} />
    </>
  );
};
