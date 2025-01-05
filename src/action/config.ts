import { type ThunkResult } from "./index";
import * as type from "./type";
import * as action from ".";

export const toggle =
  (key: keyof ConfigState): ThunkResult =>
  async (dispatch, getState) => {
    const value = getState().config[key] as boolean;
    dispatch(type.configUpdate({ [key]: !value }));
  };

export const update =
  <K extends keyof ConfigState>(key: K, value: ConfigState[K]): ThunkResult =>
  async (dispatch) => {
    dispatch(type.configUpdate({ [key]: value }));
  };

export const updateAll =
  (c: ConfigState): ThunkResult =>
  async (dispatch) => {
    dispatch(type.configUpdate(c));
  };

export const logout = (): ThunkResult => async (dispatch) => {
  await dispatch(action.event.logout());
};

export const loginGoogle = (): ThunkResult => async (dispatch) => {
  await dispatch(action.event.loginGoogle());
};
