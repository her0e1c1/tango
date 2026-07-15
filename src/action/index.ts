import type { ThunkAction } from "redux-thunk";

export * as type from "@/action/type";
export * as deck from "@/action/deck";
export * as card from "@/action/card";
export * as config from "@/action/config";
export * as event from "@/action/event";

export type ThunkResult<R = Promise<void>> = ThunkAction<R, RootState, undefined, Action>;
