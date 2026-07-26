export const REMOTE_WRITE_TIMEOUT_MS = 15_000;

export class RemoteWriteTimeoutError extends Error {
  constructor(operation: string, timeoutMs: number) {
    super(`${operation} did not finish within ${timeoutMs / 1000} seconds. Check your connection and retry.`);
    this.name = "RemoteWriteTimeoutError";
  }
}

export const waitForRemoteWrite = async <T>(
  operation: Promise<T>,
  name: string,
  timeoutMs = REMOTE_WRITE_TIMEOUT_MS
): Promise<T> => {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new RemoteWriteTimeoutError(name, timeoutMs)), timeoutMs);
  });

  try {
    return await Promise.race([operation, deadline]);
  } finally {
    if (timeout != null) clearTimeout(timeout);
  }
};
