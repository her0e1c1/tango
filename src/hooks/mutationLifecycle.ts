/**
 * @file Runs a complete mutation use case so retries repeat its optimistic and success behavior.
 */

export interface MutationLifecycle<Context = unknown> {
  onMutate?: () => Context | Promise<Context>;
  onSuccess?: (context: Context | undefined) => void | Promise<void>;
  onError?: (error: unknown, context: Context | undefined) => void | Promise<void>;
  onSettled?: (context: Context | undefined) => void | Promise<void>;
}

/**
 * Executes optimistic setup, the remote operation, success handling, rollback, and cleanup as one
 * retryable unit. Error and cleanup callbacks are best-effort so the original operation failure is
 * preserved for the mutation notice and retry boundary.
 */
export const runMutationLifecycle = async <Result, Context = unknown>(
  operation: () => Promise<Result>,
  lifecycle?: MutationLifecycle<Context>
): Promise<Result> => {
  let context: Context | undefined;
  try {
    context = await lifecycle?.onMutate?.();
    const result = await operation();
    await lifecycle?.onSuccess?.(context);
    return result;
  } catch (error) {
    try {
      await lifecycle?.onError?.(error, context);
    } catch {
      // Preserve the remote/use-case failure instead of replacing it with a rollback failure.
    }
    throw error;
  } finally {
    try {
      await lifecycle?.onSettled?.(context);
    } catch {
      // Cleanup is best-effort and must not replace the mutation result.
    }
  }
};
