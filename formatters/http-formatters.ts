import { readAll, Request } from "../deps.ts";
import { BREAK } from "../utilities/strings.ts";

type HeadersLike = Headers | Record<string, string>;

/**
 * Returns the request body to a raw string
 * @param body a reader for the request body
 * @param encoding an optional encoding to use when decoding the body
 */
export async function formatBody(
  body: Deno.Reader,
  encoding = "utf-8",
): Promise<string> {
  const bodyArray = await readAll(body);
  return new TextDecoder(encoding).decode(bodyArray);
}

/**
 * Returns the request line as a string
 * @param req An Opine request object
 */
export function formatRequestLine(req: Request) {
  return `${req.method.toUpperCase()} ${req.url} HTTP/1.1`;
}

/**
  * Returns the request headers as a block of text
  * @param headers A collection of request headers
  */
export function formatHeaders(headers: HeadersLike) {
  return headersToArray(headers).reduce(
    (acc, [name, value]) => acc += `${name}: ${value}${BREAK}`, '')
    .trimEnd();
}

/**
  * Returns a map containing the values certain headers, if found
  * @param headers A collection of request headers
  * @param keys An array of keys - if these exist in the headers, their
  * names and values will be in the returned map.
  */
export function extractHeaders(headers: HeadersLike, keys: string[]) {
  const lowerKeys = keys.map(k => k.toLowerCase());
  return headersToArray(headers).reduce((acc, [name, value]) => {
    if (lowerKeys.includes(name.toLowerCase())) {
      acc.set(name, value);
    }
    return acc;
  }, new Map<string, string>());
}

function headersToArray(headers: HeadersLike) {
  return headers instanceof Headers
    ? Array.from(headers)
    : Object.entries(headers);
}