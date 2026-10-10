// Human-readable message from anything an API call can reject with:
// apiClient's normalized { statusCode, message } object, or a plain Error.
export function errorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && typeof (err as { message?: unknown }).message === 'string') {
    const message = (err as { message: string }).message.trim();
    if (message) return message;
  }
  return fallback;
}
