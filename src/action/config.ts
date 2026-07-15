import type { ThunkResult } from "@/action/index";
import * as type from "@/action/type";
import * as action from "@/action";

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
    const editableConfig: Partial<ConfigState> = { ...c };
    delete editableConfig.uid;
    delete editableConfig.isAnonymous;
    delete editableConfig.displayName;
    delete editableConfig.lastUpdatedAt;
    dispatch(type.configUpdate(editableConfig));
  };

export const logout =
  (confirmedUid: string): ThunkResult =>
  async (dispatch) => {
    await dispatch(action.event.logout(confirmedUid));
  };

export const loginGoogle = (): ThunkResult => async (dispatch) => {
  await dispatch(action.event.loginGoogle());
};
