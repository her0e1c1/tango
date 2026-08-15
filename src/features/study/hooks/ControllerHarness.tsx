import type React from "react";
import { Controller, type ControllerProps } from "../components/Controller";
import { useStudyControllerState } from "./useStudyControllerState";

export const ControllerHarness: React.FC<ControllerProps> = (props) => {
  const controller = useStudyControllerState(props);
  return <Controller {...controller} />;
};
