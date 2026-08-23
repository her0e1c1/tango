import * as React from "react";

// Reports whether an asynchronous completion still belongs to a mounted component instance.
export const useMountedGuard = (): (() => boolean) => {
  const mounted = React.useRef(true);

  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  return () => mounted.current;
};
