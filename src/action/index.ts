import { type ThunkAction } from "redux-thunk";

export * as type from "./type";
export * as deck from "./deck";
export * as card from "./card";
export * as config from "./config";
export * as event from "./event";

export type ThunkResult<R = Promise<void>> = ThunkAction<R, RootState, undefined, Action>;
