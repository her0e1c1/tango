import { type ThunkAction } from "redux-thunk";

export * as type from "@src/action/type";
export * as deck from "@src/action/deck";
export * as card from "@src/action/card";
export * as config from "@src/action/config";
export * as event from "@src/action/event";

export type ThunkResult<R = Promise<void>> = ThunkAction<R, RootState, undefined, Action>;
