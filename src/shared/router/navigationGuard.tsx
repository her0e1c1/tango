import * as React from "react";
import { NavigationType, useBeforeUnload, useBlocker } from "react-router-dom";

import { NavigationGuardDialog } from "../ui/navigation-guard-dialog";

type AllowedNavigationIntent = { historyAction: "PUSH" | "REPLACE"; to: string };

const BeforeUnloadGuard = () => {
  useBeforeUnload(
    (event) => {
      event.preventDefault();
      // Legacy browsers require returnValue in addition to the modern preventDefault contract.
      event.returnValue = "";
    },
    { capture: true }
  );
  return null;
};

export interface NavigationGuardOptions {
  description?: React.ReactNode;
  pending?: boolean;
}

export const useNavigationGuard = (isDirty: boolean, options?: NavigationGuardOptions) => {
  const allowedNavigation = React.useRef<AllowedNavigationIntent | null>(null);
  const blocker = useBlocker(({ historyAction, nextLocation }) => {
    const historyActions = { PUSH: NavigationType.Push, REPLACE: NavigationType.Replace };
    const pending = allowedNavigation.current;
    const matchesIntent =
      pending != null &&
      historyActions[pending.historyAction] === historyAction &&
      pending.to === `${nextLocation.pathname}${nextLocation.search}${nextLocation.hash}`;
    if (matchesIntent) {
      allowedNavigation.current = null;
      return false;
    }
    return isDirty || Boolean(options?.pending);
  });

  const allowNavigation = (intent: AllowedNavigationIntent, navigate: () => void | Promise<void>) => {
    // Dismiss any unanswered confirmation prompt so intentional navigation takes precedence.
    if (blocker.state === "blocked") {
      blocker.reset();
    }
    // Each call owns its cleanup, even if an older navigation settles after a newer one starts.
    const pending = { ...intent };
    allowedNavigation.current = pending;
    const clearAllowedNavigation = () => {
      if (allowedNavigation.current === pending) allowedNavigation.current = null;
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

  return {
    allowNavigation,
    element: (
      <>
        {isDirty || options?.pending ? <BeforeUnloadGuard /> : null}
        {blocker.state === "blocked" && (
          // React Router resumes the exact destination, including Back/Forward history entries.
          <NavigationGuardDialog
            description={options?.description}
            pending={options?.pending}
            onDiscardChanges={blocker.proceed}
            onKeepEditing={blocker.reset}
          />
        )}
      </>
    ),
    isBlocked: blocker.state === "blocked",
  };
};
