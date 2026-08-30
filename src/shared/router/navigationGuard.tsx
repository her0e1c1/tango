import * as React from "react";
import { NavigationType, useBeforeUnload, useBlocker } from "react-router-dom";

import { NavigationGuardDialog } from "../ui/navigation-guard-dialog";

type AllowedNavigationIntent = { historyAction: "PUSH" | "REPLACE"; to: string };

const getLocationPath = (location: { pathname: string; search: string; hash: string }): string =>
  `${location.pathname}${location.search}${location.hash}`;

const matchesHistoryAction = (
  intendedAction: AllowedNavigationIntent["historyAction"],
  actualAction: NavigationType
): boolean => {
  if (intendedAction === "PUSH") return actualAction === NavigationType.Push;
  return actualAction === NavigationType.Replace;
};

const BeforeUnloadGuard = () => {
  useBeforeUnload(
    (event) => {
      event.preventDefault();
      // Legacy browsers require returnValue in addition to the modern preventDefault contract.
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      event.returnValue = "";
    },
    { capture: true }
  );
  return null;
};

export const useNavigationGuard = (isDirty: boolean) => {
  const allowedNavigation = React.useRef<{
    intent: AllowedNavigationIntent;
    token: symbol;
  } | null>(null);
  const blocker = useBlocker(({ historyAction, nextLocation }) => {
    const pending = allowedNavigation.current;
    const matchesIntent =
      // biome-ignore lint/suspicious/noUnnecessaryConditions: Imperative navigation arms this ref outside render.
      pending != null &&
      matchesHistoryAction(pending.intent.historyAction, historyAction) &&
      pending.intent.to === getLocationPath(nextLocation);
    if (matchesIntent) {
      allowedNavigation.current = null;
      return false;
    }
    return isDirty;
  });

  const allowNavigation = (intent: AllowedNavigationIntent, navigate: () => void | Promise<void>) => {
    const navigationToken = Symbol("allowed-navigation");
    allowedNavigation.current = { intent, token: navigationToken };
    const clearAllowedNavigation = () => {
      if (allowedNavigation.current?.token === navigationToken) allowedNavigation.current = null;
    };
    try {
      const result = navigate();
      if (result === undefined) {
        // Synchronous no-ops must not expose even a microtask-sized bypass window.
        clearAllowedNavigation();
        return;
      }
      return result.finally(clearAllowedNavigation);
    } catch (error) {
      clearAllowedNavigation();
      throw error;
    }
  };

  const keepEditing = () => {
    if (blocker.state === "blocked") blocker.reset();
  };
  const discardChanges = () => {
    // React Router owns the requested destination, including Back/Forward history entries.
    if (blocker.state === "blocked") blocker.proceed();
  };

  return {
    allowNavigation,
    element: (
      <>
        {isDirty ? <BeforeUnloadGuard /> : null}
        {blocker.state === "blocked" && (
          <NavigationGuardDialog onDiscardChanges={discardChanges} onKeepEditing={keepEditing} />
        )}
      </>
    ),
    isBlocked: blocker.state === "blocked",
  };
};
