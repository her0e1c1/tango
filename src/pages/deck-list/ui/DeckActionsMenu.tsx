/**
 * @file Defines the Deck List Page's Deck Actions Menu presentation component.
 * The component renders props and reports user intent through callbacks while data access stays
 * outside the view.
 */

import * as React from "react";
import {
  AiOutlineBarChart,
  AiOutlineRead,
  AiOutlineCloudDownload,
  AiOutlineDelete,
  AiOutlineEdit,
  AiOutlineReload,
} from "react-icons/ai";
import { useTranslation } from "react-i18next";
import { ActionsMenu, type ActionsMenuItem } from "@/shared/ui/actions-menu";

export interface DeckActionsMenuProps {
  deckName: string;
  open: boolean;
  disabled?: boolean;
  onToggle: () => void;
  onClose: () => void;
  onView?: () => void;
  onRestart?: () => void;
  onHistory?: () => void;
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
  const { t } = useTranslation();
  const { disabled, onClose, open } = props;
  React.useEffect(() => {
    if (disabled && open) onClose();
  }, [disabled, onClose, open]);

  const items: ActionsMenuItem[] = [
    {
      key: "view",
      label: t("deckView.title"),
      icon: <AiOutlineRead aria-hidden="true" />,
      ...(props.onView !== undefined ? { onSelect: props.onView } : {}),
    },
    ...(props.onRestart != null
      ? [
          {
            key: "restart",
            label: t("deckList.actions.restart"),
            icon: <AiOutlineReload aria-hidden="true" />,
            onSelect: props.onRestart,
          },
        ]
      : []),
    {
      key: "download",
      label: t("deckList.actions.download"),
      icon: <AiOutlineCloudDownload aria-hidden="true" />,
      ...(props.onDownload !== undefined ? { onSelect: props.onDownload } : {}),
    },
    {
      key: "edit",
      label: t("deckList.actions.edit"),
      icon: <AiOutlineEdit aria-hidden="true" />,
      ...(props.onEdit !== undefined ? { onSelect: props.onEdit } : {}),
    },
    {
      key: "history",
      icon: <AiOutlineBarChart aria-hidden="true" />,
      label: t("studyHistory.title"),
      ...(props.onHistory !== undefined ? { onSelect: props.onHistory } : {}),
    },
    {
      key: "delete",
      label: t("deckList.actions.delete"),
      icon: <AiOutlineDelete aria-hidden="true" />,
      danger: true,
      ...(props.onDelete !== undefined ? { onSelect: props.onDelete } : {}),
    },
  ];

  return (
    <ActionsMenu
      groupLabel={t("deckList.actions.group", { deckName: props.deckName })}
      triggerLabel={t("deckList.actions.trigger", { deckName: props.deckName })}
      menuLabel={t("deckList.actions.menu", { deckName: props.deckName })}
      open={props.open}
      {...(props.disabled !== undefined ? { disabled: props.disabled } : {})}
      onToggle={props.onToggle}
      onClose={props.onClose}
      items={items}
    />
  );
};
