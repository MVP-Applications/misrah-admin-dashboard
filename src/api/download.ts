import type { AxiosResponse } from 'axios';

// Saves a file returned by the API (responseType: 'blob') to the user's
// computer. Throws the server's message when it answered with a JSON error
// instead of a file. The name comes from Content-Disposition when the server
// exposes it, else `fallbackName`. Returns the saved file name.
export async function saveBlobResponse(response: AxiosResponse<Blob>, fallbackName: string, errorFallback: string): Promise<string> {
  const blob = response.data;
  if (blob.type.includes('application/json')) {
    const body = JSON.parse(await blob.text()) as { message?: string | string[] };
    const message = Array.isArray(body.message) ? body.message.join(' ') : body.message;
    throw new Error(message || errorFallback);
  }
  const disposition = String(response.headers['content-disposition'] ?? '');
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
  const fileName = match ? decodeURIComponent(match[1]) : fallbackName;
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  return fileName;
}
