import { useLayoutEffect } from "react";

interface LocationSource {
  readonly state: { readonly location: { readonly pathname: string } };
}

let currentSource: LocationSource | undefined;

/** Read the router itself, including while authentication temporarily hides its rendered routes. */
export const getCurrentPathname = (): string | undefined => currentSource?.state.location.pathname;

export function useRouterLocationSource(source: LocationSource): void {
  useLayoutEffect(() => {
    currentSource = source;
    return () => {
      if (currentSource === source) currentSource = undefined;
    };
  }, [source]);
}
