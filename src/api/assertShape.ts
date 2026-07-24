// Shared by every feature's api.ts that has to deal with an UNCONFIRMED
// response shape (i.e. no schema documented in the OpenAPI spec — common with
// this backend). Throws (never just warns) on a mismatch: a caller must not
// proceed with a response missing fields it depends on — that exact mistake
// once let a real login through with a null user and sent the app into an
// infinite redirect loop. See API_INTEGRATION.md → "Known Gaps".
export function assertResponseShape<T>(label: string, data: unknown, requiredFields: string[]): T {
  const missing = requiredFields.filter((field) => !data || typeof data !== 'object' || !(field in data));
  if (missing.length > 0) {
    console.error(
      `[api] ${label} response is missing expected field(s): ${missing.join(', ')}. ` +
        `The expected shape is UNCONFIRMED (placeholder) and doesn't match the real API. ` +
        `Update the relevant feature's types.ts and this assertResponseShape call to match. ` +
        `See API_INTEGRATION.md → "Known Gaps". Actual response:`,
      data,
    );
    throw new Error(
      `The server's ${label} response doesn't match what this app expects (missing: ${missing.join(', ')}). ` +
        `This is a known integration gap — see the browser console and API_INTEGRATION.md.`,
    );
  }
  return data as T;
}
