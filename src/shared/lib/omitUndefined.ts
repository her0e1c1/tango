export type OmitUndefined<T extends Record<string, unknown>> = {
  [K in keyof T as undefined extends T[K] ? never : K]: T[K];
} & {
  [K in keyof T as undefined extends T[K] ? K : never]?: Exclude<T[K], undefined>;
};

export const omitUndefined = <T extends Record<string, unknown>>(value: T): OmitUndefined<T> =>
  Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as OmitUndefined<T>;
