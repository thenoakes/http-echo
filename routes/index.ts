import { opine, Request, Response, NextFunction, parseMultipartRelated } from "../deps.ts";
import parseContentType from '../utilities/content-type.ts';
import { snipLargeContent, maxLength } from '../config.ts';
import { EMPTY, BREAK } from '../utilities/strings.ts';

/** A utility function which returns an object with the given keys but undefined value */
function undefinedKeys(...keys : string[]) : Record<string, string> {
  return Object.assign({}, ...keys.map(k => ({ [k] : undefined})));
}

/** Returns a function which will log whatever is passed to it to the console and to a new file, as per configuration */
async function initialiseEcho () {
  const writeToLog = await (async () => {
    const log_file = await Deno.open(`post${new Date().getTime()}.http`, {
      create: true,
      append: true,
    });
    const resourceId = log_file.rid;
    return async (output: string) => {
      const buffer: Uint8Array = new TextEncoder().encode(output + BREAK);
      await Deno.write(resourceId, buffer);
    };
  })();

  return async (output: string) => {
    await writeToLog(output);
    const contentLength = output.length;
    if (!snipLargeContent || contentLength <= maxLength) {
      console.log(output);
    } else {
      console.log(
        `${output.slice(0, maxLength / 2)}` +
          ` ${BREAK} < ... snip ... > ${BREAK} ` +
          `${output.slice(contentLength - maxLength / 2, contentLength)}`
      );
    }
  };
}

/** Returns a raw 'printout' of the received headers and, if passed a second object, 
 * populates it it with the values of any headers which match its key names
 */
function echoIncomingHeaders(headers: Headers, parsedHeaders: Record<string, string | undefined> | undefined = undefined) : string {
  let output = '';
  for (let header of headers.keys()) {
    output += header + ": " + headers.get(header) + BREAK;
    if (parsedHeaders !== undefined) {
      if (header.toLowerCase() in parsedHeaders) parsedHeaders[header.toLowerCase()] = headers.get(header) || undefined;     
    }
  }
  return output.trimEnd();
}

/**
 * A middleware function that examines an HTTP request and attempts to reconstruct its raw form 
 * which is then written to the console and to a new file 
 */
async function echoAfterParsing(req: Request, res: Response, next: NextFunction) {

  const CONTENT_TYPE = 'content-type';

  const extractedHeaders = undefinedKeys(CONTENT_TYPE);
  const headerBlock = echoIncomingHeaders(req.headers, extractedHeaders);
  const contentType = extractedHeaders[CONTENT_TYPE];

  if (!contentType) 
    throw Error('Cannot parse: Content-Type header not found');

  const contentTypeInfo = parseContentType(contentType);

  if (!contentTypeInfo || contentTypeInfo.mediaType.toLowerCase() !== 'multipart/related') 
    throw Error('Only multipart/related is currently supported');

  const boundary = contentTypeInfo?.parameters?.boundary;

  if (!boundary)
    throw Error('Cannot parse: boundary parameter not found');

  console.log(EMPTY);

  // -- OK, we can start now --

  const echo = await initialiseEcho();

  await echo(`${req.method.toUpperCase()} ${req.url} HTTP/1.1`);
  await echo(headerBlock);
  
  const bodyArray = await Deno.readAll(req.body);
  const bodyString = new TextDecoder("utf-8").decode(bodyArray);

  const parsedRequest = await parseMultipartRelated(bodyString, boundary);

  for (let part of parsedRequest) {
    await echo(BREAK + "--" + boundary);

    // Print the part's headers
    for (let header in part.headers) {
      await echo(header + ": " + part.headers[header]);
    }

    await echo(EMPTY);
    await echo(part.content.trimEnd());
  }

  await echo(BREAK + "--" + boundary + "--");
  res.sendStatus(200);

  return console.log(
    `${BREAK}^^ MULTIPART POST LOGGED @ ${new Date()} ^^${BREAK}`
  );
}

/**
 * A middleware function that just prints back a raw HTTP request without
 * attempting to understand the structure of the body
 */
async function echoRaw(req: Request, res: Response, next: NextFunction) {

  const echo = await initialiseEcho();

  // Method & URL
  await echo(`${req.method.toUpperCase()} ${req.url} HTTP/1.1`);

  // Headers
  const headers = echoIncomingHeaders(req.headers);
  await echo(headers);

  await echo(EMPTY);

  // Body
  // TODO: Deal with deflate and gzip, content-encoding
  const rawBody = await Deno.readAll(req.body);
  const body = new TextDecoder().decode(rawBody);
  await echo(body);

  res.sendStatus(200);

  return console.log(
    `${BREAK}^^ MULTIPART POST LOGGED @ ${new Date()} ^^${BREAK}`
  );
}


const router = opine.Router();
router.post("/multipart", echoAfterParsing);
router.post("/raw", echoRaw);        
router.post("/ping", (req: Request, res: Response) => {
  res.sendStatus(200);
});

export default router;
