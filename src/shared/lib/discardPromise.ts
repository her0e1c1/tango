/**
 * Detaches an operation from a synchronous callback while ensuring a rejected promise is observed.
 */
export const discardPromise = (operation: void | PromiseLike<void>): void => {
  Promise.resolve(operation).catch(() => undefined);
};
