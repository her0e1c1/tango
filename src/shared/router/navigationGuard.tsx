import * as React from "react";
import { useBeforeUnload, useBlocker } from "react-router-dom";

import { NavigationGuardDialog } from "../ui/navigation-guard-dialog";

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
  const bypassNextNavigation = React.useRef<boolean>(false);
  const blocker = useBlocker(() => {
    // biome-ignore lint/suspicious/noUnnecessaryConditions: Imperative success navigation sets this ref synchronously.
    if (bypassNextNavigation.current) {
      bypassNextNavigation.current = false;
      return false;
    }
    return isDirty;
  });

  const allowNavigation = (navigate: () => void) => {
    bypassNextNavigation.current = true;
    try {
      navigate();
    } finally {
      // A no-op or failed navigation must not let a later unrelated navigation escape the guard.
      bypassNextNavigation.current = false;
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
