import { useMountedState } from "react-use";

// Reports whether an asynchronous completion still belongs to a mounted component instance.
export const useMountedGuard = (): (() => boolean) => useMountedState();
