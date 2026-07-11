export class BodyTooLargeError extends Error {}

function declaredLength(headers: Headers) {
  const value = Number(headers.get("content-length"));
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export function requestFitsDeclaredLimit(request: Request, maxBytes: number) {
  const length = declaredLength(request.headers);
  return length === null || length <= maxBytes;
}

async function readTextWithLimit(
  body: ReadableStream<Uint8Array> | null,
  headers: Headers,
  maxBytes: number,
) {
  const length = declaredLength(headers);
  if (length !== null && length > maxBytes) throw new BodyTooLargeError();
  if (!body) return "";

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > maxBytes) {
      await reader.cancel();
      throw new BodyTooLargeError();
    }
    text += decoder.decode(value, { stream: true });
  }

  return text + decoder.decode();
}

export async function readJsonRequest<T>(request: Request, maxBytes: number) {
  return JSON.parse(
    await readTextWithLimit(request.body, request.headers, maxBytes),
  ) as T;
}

export async function readJsonResponse<T>(response: Response, maxBytes: number) {
  return JSON.parse(
    await readTextWithLimit(response.body, response.headers, maxBytes),
  ) as T;
}
