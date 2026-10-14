// A stalled connection must not leave editing or submission controls busy forever.
export async function clientRequest(
  input: RequestInfo | URL,
  init: RequestInit = {},
) {
  try {
    return await fetch(input, {
      ...init,
      signal: init.signal
        ? AbortSignal.any([init.signal, AbortSignal.timeout(20000)])
        : AbortSignal.timeout(20000),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError")
      throw new Error(
        "The server took too long to respond. Reload to check whether your change was saved before trying again.",
      );
    throw error;
  }
}
