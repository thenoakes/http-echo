import { Request } from "../deps.ts";
import { BREAK } from '../utilities/strings.ts';


/**
 * Returns the request body to a raw string
 * @param {Deno.Reader} body a reader for the request body 
 * @param {string} encoding an optional encoding to use when decoding the body
 */
export async function formatBody(body: Deno.Reader, encoding: string = 'utf-8') {
  const bodyArray = await Deno.readAll(body);
  return new TextDecoder(encoding).decode(bodyArray);
}

/**
 * Returns the request line as a string
 * @param {Request} req An Opine request object
 */
export function formatRequestLine(req: Request) {
  return `${req.method.toUpperCase()} ${req.url} HTTP/1.1`
}

 /**
  * Returns the request headers as a block of text
  * @param {Headers} headers A collection of request headers
  * @param parsedHeaders An optional object containing lower-cased keys. 
  *   If passed in, the values of any headers that match keys in this object will be added to the object
  */
export function formatHeaders(headers: Headers, parsedHeaders: Record<string, string | undefined> | undefined = undefined) : string {
  let output = '';
  for (let header of headers.keys()) {
    output += header + ": " + headers.get(header) + BREAK;
    if (parsedHeaders !== undefined) {
      if (header.toLowerCase() in parsedHeaders) parsedHeaders[header.toLowerCase()] = headers.get(header) || undefined;     
    }
  }
  return output.trimEnd();
}