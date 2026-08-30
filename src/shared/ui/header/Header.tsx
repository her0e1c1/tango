/**
 * @file Defines the reusable Header component in the shared layout library.
 * Feature screens compose this building block through props instead of duplicating presentation
 * and interaction rules.
 */

import cx from "classnames";
import type * as React from "react";
import { IconContext } from "react-icons";
import { AiFillMoon, AiFillSetting, AiOutlineSun, AiOutlineUpload, AiOutlineUser } from "react-icons/ai";

import { Logo } from "../logo";

interface HeaderLabels {
  switchToLightMode: string;
  switchToDarkMode: string;
  importDecks: string;
  openAccount: string;
  openSettings: string;
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
}

const defaultLabels: HeaderLabels = {
  switchToLightMode: "Switch to light mode",
  switchToDarkMode: "Switch to dark mode",
  importDecks: "Import decks",
  openAccount: "Open account",
  openSettings: "Open settings",
};

/**
 * Renders the Header user interface.
 * Builds the application header from navigation, title, and action props and can keep it fixed
 * above scrolling content.
 */
export const Header: React.FC<HeaderProps> = (props) => {
  const labels = { ...defaultLabels, ...props.labels };

  return (
    <IconContext.Provider
      value={{
        className:
          "size-touch shrink-0 cursor-pointer rounded-control p-2 text-ink transition-colors duration-fast ease-calm hover:bg-surface-muted",
      }}
    >
      <header
        className={cx(
          "flex",
          "w-full",
          "items-center",
          "gap-1",
          "bg-surface-elevated",
          "pb-2",
          "text-ink",
          "shadow-elevated",
          "sm:gap-3",
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
        {props.dark ? (
          <button type="button" aria-label={labels.switchToLightMode} onClick={() => props.onClickDarkMode?.(false)}>
            <AiOutlineSun />
          </button>
        ) : (
          <button type="button" aria-label={labels.switchToDarkMode} onClick={() => props.onClickDarkMode?.(true)}>
            <AiFillMoon />
          </button>
        )}
        <button type="button" aria-label={labels.importDecks} onClick={props.onClickImport}>
          <AiOutlineUpload />
        </button>
        <button type="button" aria-label={labels.openAccount} onClick={props.onClickAccount}>
          <AiOutlineUser />
        </button>
        <button type="button" aria-label={labels.openSettings} onClick={props.onClickSettings}>
          <AiFillSetting />
        </button>
      </header>
    </IconContext.Provider>
  );
};
