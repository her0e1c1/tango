/** @file Renders application navigation with a compact menu on small screens. */

import cx from "classnames";
import * as React from "react";
import {
  AiOutlineBarChart,
  AiFillMoon,
  AiFillSetting,
  AiOutlineSun,
  AiOutlineUpload,
  AiOutlineUser,
  AiOutlineMenu,
} from "react-icons/ai";

import { ActionsMenu } from "../actions-menu";
import { Logo } from "../logo";

interface HeaderLabels {
  switchToLightMode: string;
  switchToDarkMode: string;
  importDecks: string;
  openAccount: string;
  openSettings: string;
  studyHistory: string;
  menu: string;
}

export interface HeaderProps {
  fixed?: boolean;
  dark?: boolean;
  labels?: Partial<HeaderLabels>;
  onClickLogo?: () => void;
  onClickDarkMode?: (b: boolean) => void;
  onClickImport?: () => void;
  onClickAccount?: () => void;
  onClickSettings?: () => void;
  onClickStudyHistory?: () => void;
}

const defaultLabels: HeaderLabels = {
  switchToLightMode: "Switch to light mode",
  switchToDarkMode: "Switch to dark mode",
  importDecks: "Import decks",
  openAccount: "Open account",
  openSettings: "Open settings",
  studyHistory: "Study history",
  menu: "Menu",
};

const buttonClassName =
  "inline-flex size-touch shrink-0 items-center justify-center rounded-control text-ink transition-colors duration-fast ease-calm hover:bg-surface-muted";

export const Header: React.FC<HeaderProps> = (props) => {
  const labels = { ...defaultLabels, ...props.labels };
  const [menuOpen, setMenuOpen] = React.useState(false);
  const items = [
    {
      key: "import",
      label: labels.importDecks,
      icon: <AiOutlineUpload aria-hidden="true" size={24} />,
      onSelect: () => props.onClickImport?.(),
    },
    {
      key: "account",
      label: labels.openAccount,
      icon: <AiOutlineUser aria-hidden="true" size={24} />,
      onSelect: () => props.onClickAccount?.(),
    },
    {
      key: "settings",
      label: labels.openSettings,
      icon: <AiFillSetting aria-hidden="true" size={24} />,
      onSelect: () => props.onClickSettings?.(),
    },
    {
      key: "appearance",
      label: props.dark ? labels.switchToLightMode : labels.switchToDarkMode,
      icon: props.dark ? <AiOutlineSun aria-hidden="true" size={24} /> : <AiFillMoon aria-hidden="true" size={24} />,
      onSelect: () => props.onClickDarkMode?.(!props.dark),
    },
  ];

  return (
    <header
      className={cx(
        "flex w-full items-center gap-1 border-b border-border bg-surface-elevated pb-2 text-ink sm:gap-3",
        "pl-[calc(var(--spacing-shell-gutter)+env(safe-area-inset-left))]",
        "pr-[calc(var(--spacing-shell-gutter)+env(safe-area-inset-right))]",
        "pt-[calc(0.5rem+env(safe-area-inset-top))]",
        props.fixed && ["fixed", "inset-x-0", "top-0", "z-50"]
      )}
    >
      <Logo
        className="flex min-h-touch min-w-0 flex-1 items-center rounded-control px-2"
        {...(props.onClickLogo !== undefined ? { onClick: props.onClickLogo } : {})}
      />
      <button
        type="button"
        className={buttonClassName}
        aria-label={labels.studyHistory}
        onClick={props.onClickStudyHistory}
      >
        <AiOutlineBarChart aria-hidden="true" size={24} />
      </button>
      <div className="hidden items-center gap-3 sm:flex">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            className={buttonClassName}
            aria-label={item.label}
            onClick={item.onSelect}
          >
            {item.icon}
          </button>
        ))}
      </div>
      <div className="sm:hidden">
        <ActionsMenu
          mobileSheet
          groupLabel={labels.menu}
          triggerLabel={labels.menu}
          triggerContent={<AiOutlineMenu aria-hidden="true" size={24} />}
          menuLabel={labels.menu}
          open={menuOpen}
          onToggle={() => setMenuOpen((open) => !open)}
          onClose={() => setMenuOpen(false)}
          items={items}
        />
      </div>
    </header>
  );
};
