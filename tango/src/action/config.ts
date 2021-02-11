import { ThunkResult } from "./index";
import * as type from "src/action/type";

export const toggle = (key: keyof ConfigState): ThunkResult => async (
    dispatch,
    getState
) => {
    const value = getState().config[key];
    dispatch(type.configUpdate({ [key]: !value }));
};