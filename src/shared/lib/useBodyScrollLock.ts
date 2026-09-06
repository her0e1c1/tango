import * as React from "react";

let locks = 0;
let previousOverflow = "";

/** Nested dialogs can unmount with their parent, so restore scrolling only after the last owner releases it. */
export const useBodyScrollLock = () => {
  React.useEffect(() => {
    if (locks === 0) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    locks += 1;
    return () => {
      locks -= 1;
      if (locks === 0) document.body.style.overflow = previousOverflow;
    };
  }, []);
};
