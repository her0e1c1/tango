import { useLayoutEffect } from "react";

import { mountAccountPage } from "./actions/mountAccountPage";
import { unmountAccountPage } from "./actions/unmountAccountPage";

export const useAccountPageLifecycle = () => {
  // Register before the page can receive input, and invalidate ownership during the unmount commit.
  useLayoutEffect(() => {
    const ownerId = mountAccountPage();
    return () => unmountAccountPage(ownerId);
  }, []);
};
