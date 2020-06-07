import { opine, Request, Response, NextFunction } from "../deps.ts";
import parseContentType from '../utilities/content-type.ts';
import { snipLargeContent, maxLength } from '../config.ts';
import { EMPTY, BREAK } from '../utilities/strings.ts';
import { multipartRelated } from './multipart-related.ts';
import { formatHeaders } from '../formatters/http-formatters.ts';

/** A utility function which returns an object with the given keys but undefined value */
function undefinedKeys(...keys : string[]) : Record<string, string> {
  return Object.assign({}, ...keys.map(k => ({ [k] : undefined})));
}

/** Returns a function which will log whatever is passed to it to the console and to a new file, as per configuration */
export async function initialiseEcho () {
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

/**
 * A middleware function that examines an HTTP request and attempts to reconstruct its raw form 
 * which is then written to the console and to a new file 
 */
async function echoAfterParsing(req: Request, res: Response, next: NextFunction) {

  const contentType = (key => {
    const extractedHeaders = undefinedKeys(key);
    formatHeaders(req.headers, extractedHeaders);
    return extractedHeaders[key];
  })('content-type');

  if (!contentType) {
    throw Error('Cannot parse: Content-Type header not found');
  }

  const contentTypeInfo = parseContentType(contentType);

  if (!contentTypeInfo) {
    return res.setStatus(400).send('Content-Type header was not found');
  }

  console.log(EMPTY);

  // Content-Type-dependent parsing
  switch (contentTypeInfo.mediaType.toLowerCase()) {
    case 'multipart/related':
      const boundary = contentTypeInfo.parameters?.boundary;
      if (!boundary) {
        return res.setStatus(400).send('Content-Type header did not include required parameter "boundary"');
      }
      await multipartRelated(req, contentTypeInfo);
      break;
    default:
      return res.setStatus(500).send('Cannot currently handle Content-Type: ' + contentTypeInfo.mediaType);
  }

  res.sendStatus(200);

  return console.log(
    `${BREAK}^^ HTTP ${req.method.toUpperCase()} LOGGED @ ${new Date()} ^^${BREAK}`
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
  const headers = formatHeaders(req.headers);
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
