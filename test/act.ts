import { act } from "@testing-library/react";

/** Selects the async overload that Biome 2.5.7 fails to infer from React's overloaded declaration. */
export const actAsync = act as <T>(callback: () => Promise<T>) => Promise<T>;
