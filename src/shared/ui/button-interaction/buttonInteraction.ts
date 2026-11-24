/**
 * @file Provides shared keyboard-accessible button behavior for non-button elements.
 * The hook mirrors native Enter, Space, focus, and click interactions when a visual component must
 * act like a button.
 */

import { useState } from "react";
import type * as React from "react";

type ButtonInteraction<Element extends HTMLElement> = Pick<
  React.HTMLAttributes<Element>,
  "onBlur" | "onClick" | "onKeyDown" | "onKeyUp" | "role" | "tabIndex"
>;

/**
 * Adds native-like keyboard and click behavior when a non-button element is interactive.
 * Enter activates immediately, Space activates on release, and nested controls keep their own
 * events.
 */
export const useButtonInteraction = <Element extends HTMLElement>(
  onClick: (() => void) | undefined
): ButtonInteraction<Element> | Record<string, never> => {
  const [spacePressed, setSpacePressed] = useState(false);
  if (onClick === undefined && spacePressed) setSpacePressed(false);

  if (onClick === undefined) return {};

  return {
    onBlur: (event) => {
      if (event.target === event.currentTarget) setSpacePressed(false);
    },
    onClick,
    onKeyDown: (event) => {
      if (event.target !== event.currentTarget) return;

      if (event.key === " ") {
        event.preventDefault();
        if (!event.repeat) setSpacePressed(true);
      } else if (event.key === "Enter") {
        event.preventDefault();
        if (!event.repeat) onClick();
      }
    },
    onKeyUp: (event) => {
      if (event.target !== event.currentTarget || event.key !== " ") return;

      event.preventDefault();
      if (spacePressed) {
        setSpacePressed(false);
        onClick();
      }
    },
    role: "button",
    tabIndex: 0,
  };
};
