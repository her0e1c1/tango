import cx from "classnames";
import type * as React from "react";
import { IconContext } from "react-icons";
import { AiFillSetting, AiOutlineUpload, AiOutlineSun, AiFillMoon } from "react-icons/ai";
import { Logo } from "@/shared/components/content/Logo";

export interface HeaderProps {
  fixed?: boolean;
  dark?: boolean;
  onClickLogo?: () => void;
  onClickDarkMode?: (b: boolean) => void;
  onClickMenuItem?: (key: PageKey) => void;
}

export const Header: React.FC<HeaderProps> = (props) => {
  return (
    <IconContext.Provider
      value={{
        className:
          "size-touch shrink-0 cursor-pointer rounded-control p-2 text-ink transition-colors duration-fast ease-calm hover:bg-surface-muted",
      }}
    >
      <div
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
          <AiOutlineSun onClick={() => props.onClickDarkMode?.(false)} />
        ) : (
          <AiFillMoon onClick={() => props.onClickDarkMode?.(true)} />
        )}
        <AiOutlineUpload onClick={() => props.onClickMenuItem?.("upload")} />
        <AiFillSetting onClick={() => props.onClickMenuItem?.("config")} />
      </div>
    </IconContext.Provider>
  );
};
