import { Request, Colors } from "../deps.ts";
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
  return `${Colors.green(req.method.toUpperCase())} ${req.url} ` + Colors.green('HTTP/1.1');
}

 /**
  * Returns the request headers as a block of text
  * @param {Headers} headers A collection of request headers
  * @param parsedHeaders An optional object containing lower-cased keys. 
  *   If passed in, the values of any headers that match keys in this object will be added to the object
  */
export function formatHeaders(
  headers: Headers | Record<string, string>, 
  parsedHeaders: Record<string, string | undefined> | undefined = undefined) : string {
  
  const _headers : string[][] = headers instanceof Headers
    ? Array.from(headers) 
    : Object.keys(headers).map(k => [k, headers[k]]);
      
  let output = '';
  for (let header of _headers) {
    output += Colors.green(header[0] + ": ") + header[1] + BREAK;
    if (parsedHeaders !== undefined) {
      if (header[0].toLowerCase() in parsedHeaders) parsedHeaders[header[0].toLowerCase()] = header[1] || undefined;     
    }
  }
  return output.trimEnd();
}