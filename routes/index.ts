import { opine, Request, Response, NextFunction, parseMultipartRelated } from "../deps.ts";
import parseContentType from '../utilities/content-type.ts';

const router = opine.Router();

const EMPTY = "";
const BREAK = "\r\n";

// ==== QUICK AND DIRTY CONFIGURATION ====

/**
 * Should the output of large POSTs in the console be snipped
 * (setting to false can cause performance issues for large payloads).
 * Messages are always saved in full to a file.
 * */
const snipLargeContent = true;

/** The number of characters to cap a large payload to, when snipping */
const maxLength = 10000;

async function echoMultipartPost(req: Request, res: Response, next: NextFunction) {

  // Pre-read headers
  let headerBlock = '';
  let contentType : string | null = null;
  for (let header of req.headers.keys()) {
    headerBlock += header + ": " + req.headers.get(header) + BREAK;
    if (header.toLowerCase() === "content-type") {
      contentType = req.headers.get(header);
    }
  }

  if (!contentType) 
    throw Error('Cannot parse: Content-Type header not found');

  const contentTypeInfo = parseContentType(contentType);

  if (!contentTypeInfo || contentTypeInfo.mediaType.toLowerCase() !== 'multipart/related') 
    throw Error('Only multipart/related is currently supported');

  const boundary = contentTypeInfo?.parameters?.boundary;

  if (!boundary)
    throw Error('Cannot parse: boundary parameter not found');

  // -- OK, we can start now --

  /** A function for writing out to the console (optionally snipped) and to a new file */
  const echo = await (async () => {
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
  })();

  
  console.log(EMPTY);
  await echo(`POST ${req.url} HTTP/1.1`);
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

    await echo(BREAK);
    await echo(part.content);
  }

  await echo(BREAK + "--" + boundary + "--");
  res.sendStatus(200);

  return console.log(
    `${BREAK}^^ MULTIPART POST LOGGED @ ${new Date()} ^^${BREAK}`
  );
}

router.post("/multipart", echoMultipartPost);

router.post("/ping", (req: Request, res: Response) => {
  res.sendStatus(200);
});

export default router;
