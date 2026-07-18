import type * as React from "react";
import { AiOutlineDelete, AiOutlineEdit } from "react-icons/ai";
import { ActionsMenu, type ActionsMenuItem } from "@/shared/components/forms/ActionsMenu";

export interface CardActionsMenuProps {
  cardText: string;
  open: boolean;
  disabled?: boolean;
  onToggle: () => void;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const CardActionsMenu: React.FC<CardActionsMenuProps> = (props) => {
  const items: ActionsMenuItem[] = [
    {
      key: "edit",
      label: "Edit",
      icon: <AiOutlineEdit aria-hidden="true" />,
      ...(props.onEdit !== undefined ? { onSelect: props.onEdit } : {}),
    },
    {
      key: "delete",
      label: "Delete",
      icon: <AiOutlineDelete aria-hidden="true" />,
      danger: true,
      ...(props.onDelete !== undefined ? { onSelect: props.onDelete } : {}),
    },
  ];

  return (
    <ActionsMenu
      groupLabel={`Card actions for ${props.cardText}`}
      triggerLabel={`Open actions for ${props.cardText}`}
      menuLabel={`Actions for ${props.cardText}`}
      open={props.open}
      {...(props.disabled !== undefined ? { disabled: props.disabled } : {})}
      onToggle={props.onToggle}
      onClose={props.onClose}
      items={items}
    />
  );
};
