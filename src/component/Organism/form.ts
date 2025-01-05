import { type UseFormRegisterReturn } from "react-hook-form";

export const renameKey = (object: any): UseFormRegisterReturn & { inputRef: React.Ref<any> } => {
  const key = "ref";
  const newKey = "inputRef";
  const clone = (obj: any) => Object.assign({}, obj);
  const clonedObj = clone(object);
  const targetKey = clonedObj[key];
  delete clonedObj.ref;
  clonedObj[newKey] = targetKey;
  return clonedObj;
};
