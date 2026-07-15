import type { UseFormRegisterReturn } from "react-hook-form";

type RenamedRegister = Omit<UseFormRegisterReturn, "ref"> & {
  inputRef: UseFormRegisterReturn["ref"];
};

export const renameKey = ({ ref, ...register }: UseFormRegisterReturn): RenamedRegister => ({
  ...register,
  inputRef: ref,
});
