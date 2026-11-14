import { useLayoutEffect } from "react";

interface LocationSource {
  subscribe: (listener: () => void) => () => void;
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

/** Observe committed navigation, not loading-state updates or temporary route unmounts. */
export function subscribeRouterLocationChange(listener: () => void): () => void {
  const source = currentSource;
  if (source === undefined) return () => undefined;
  let previous = source.state.location;
  return source.subscribe(() => {
    const next = source.state.location;
    if (previous === next) return;
    previous = next;
    listener();
  });
}
