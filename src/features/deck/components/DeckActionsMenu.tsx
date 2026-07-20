/**
 * @file Defines the deck feature's Deck Actions Menu presentation component.
 * The component renders props and reports user intent through callbacks while data access stays
 * outside the view.
 */

import * as React from "react";
import { AiOutlineCloudDownload, AiOutlineDelete, AiOutlineEdit, AiOutlineReload } from "react-icons/ai";
import { ActionsMenu, type ActionsMenuItem } from "@/components/forms/ActionsMenu";

export interface DeckActionsMenuProps {
  deckName: string;
  open: boolean;
  disabled?: boolean;
  onToggle: () => void;
  onClose: () => void;
  onRestart?: () => void;
  onDownload?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

/**
 * Renders the Deck Actions Menu user interface.
 * Offers deck actions, closes when disabled during pending work, and reports selections and
 * dismissal to its owner.
 */
export const DeckActionsMenu: React.FC<DeckActionsMenuProps> = (props) => {
  const { disabled, onClose, open } = props;
  React.useEffect(() => {
    if (disabled && open) onClose();
  }, [disabled, onClose, open]);

  const items: ActionsMenuItem[] = [
    ...(props.onRestart != null
      ? [{ key: "restart", label: "Restart", icon: <AiOutlineReload aria-hidden="true" />, onSelect: props.onRestart }]
      : []),
    {
      key: "download",
      label: "Download",
      icon: <AiOutlineCloudDownload aria-hidden="true" />,
      ...(props.onDownload !== undefined ? { onSelect: props.onDownload } : {}),
    },
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
      groupLabel={`Deck actions for ${props.deckName}`}
      triggerLabel={`Open actions for ${props.deckName}`}
      menuLabel={`Actions for ${props.deckName}`}
      open={props.open}
      {...(props.disabled !== undefined ? { disabled: props.disabled } : {})}
      onToggle={props.onToggle}
      onClose={props.onClose}
      items={items}
    />
  );
};
