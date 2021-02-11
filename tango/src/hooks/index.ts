import * as React from "react";
import { useDispatch } from "react-redux";
import { Action } from "redux";
import { ThunkAction } from "redux-thunk";

export { useDispatch };

// TODO: remove duplicated ThunkResult
export type ThunkResult<R = void> = ThunkAction<
  R,
  RootState,
  undefined,
  Action
>;

export function useThunkAction(action: ThunkResult) {
  const dispatch = useDispatch();
  return React.useCallback(() => {
    return dispatch(action);
  }, [dispatch]);
};
