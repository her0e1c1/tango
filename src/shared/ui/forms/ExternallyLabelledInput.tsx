import { useId } from "react";

import { Input } from "./Input";

export const ExternallyLabelledInput = () => {
  const inputId = useId();
  return (
    <>
      <label htmlFor={inputId}>GitHub access token</label>
      <Input id={inputId} />
    </>
  );
};
