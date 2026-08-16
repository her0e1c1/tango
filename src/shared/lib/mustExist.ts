// Converts a boundary guarantee into a non-optional value without spreading defensive branches through consumers.
export const mustExist = <Value>(value: Value | null | undefined, message: string): Value => {
  if (value == null) throw new Error(message);
  return value;
};
