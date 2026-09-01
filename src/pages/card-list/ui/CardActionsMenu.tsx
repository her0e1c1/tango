/**
 * @file Defines the Card List Page's actions menu presentation component.
 * The component renders props and reports user intent through callbacks while data access stays
 * outside the view.
 */

import type * as React from "react";
import { AiOutlineDelete, AiOutlineEdit } from "react-icons/ai";
import { useTranslation } from "react-i18next";
import { ActionsMenu, type ActionsMenuItem } from "@/shared/ui/actions-menu";

export interface CardActionsMenuProps {
  cardText: string;
  open: boolean;
  disabled?: boolean;
  onToggle: () => void;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

/**
 * Renders the Card Actions Menu user interface.
 * Offers edit and delete actions for a card and reports closing, selection, and pending state to
 * its owner.
 */
export const CardActionsMenu: React.FC<CardActionsMenuProps> = (props) => {
  const { t } = useTranslation();
  const items: ActionsMenuItem[] = [
    {
      key: "edit",
      label: t("cardList.actions.edit"),
      icon: <AiOutlineEdit aria-hidden="true" />,
      ...(props.onEdit !== undefined ? { onSelect: props.onEdit } : {}),
    },
    {
      key: "delete",
      label: t("cardList.actions.delete"),
      icon: <AiOutlineDelete aria-hidden="true" />,
      danger: true,
      ...(props.onDelete !== undefined ? { onSelect: props.onDelete } : {}),
    },
  ];

  return (
    <ActionsMenu
      groupLabel={t("cardList.actions.group", { cardText: props.cardText })}
      triggerLabel={t("cardList.actions.trigger", { cardText: props.cardText })}
      menuLabel={t("cardList.actions.menu", { cardText: props.cardText })}
      open={props.open}
      {...(props.disabled !== undefined ? { disabled: props.disabled } : {})}
      onToggle={props.onToggle}
      onClose={props.onClose}
      items={items}
    />
  );
};
