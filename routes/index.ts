import type { NextFunction, OpineRequest, OpineResponse } from "opine";
import { Router } from "opine";
import parseContentType from "../utilities/content-type.ts";
import { maxLength, snipLargeContent } from "../config.ts";
import { BREAK, EMPTY } from "../utilities/strings.ts";
import { multipart } from "./multipart.ts";
import {
  extractHeaders,
  formatBody,
  formatHeaders,
} from "../formatters/http-formatters.ts";

/** Returns a function which will log whatever is passed to it to the console and to a new file, as per configuration */
export async function initialiseEcho() {
  const writeToLog = await (async () => {
    const logFile = await Deno.open(`post${new Date().getTime()}.http`, {
      create: true,
      append: true,
    });
    const resourceId = logFile.rid;
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
          `${output.slice(contentLength - maxLength / 2, contentLength)}`,
      );
    }
  };
}

/**
 * A middleware function that examines an HTTP request and attempts to reconstruct its raw form
 * which is then written to the console and to a new file
 */
async function echoAfterParsing(
  req: OpineRequest,
  res: OpineResponse,
  _next: NextFunction,
) {
  // 1. GET CONTENT TYPE
  const contentType = ((key) => extractHeaders(req.headers, [key]).get(key))(
    "content-type",
  );
  if (!contentType) {
    throw Error("Cannot parse: Content-Type header not found");
  }

  // 2. EXAMINE CONTENT TYPE
  const contentTypeInfo = parseContentType(contentType);
  if (!contentTypeInfo) {
    return res.setStatus(400).send("Content-Type header was not found");
  }

  console.log(EMPTY);

  // 3. PASS TO APPROPRIATE HANDLER
  try {
    // Content-Type-dependent parsing
    switch (contentTypeInfo.type.toLowerCase()) {
      case "multipart":
        await multipart(req, contentTypeInfo);
        break;
      default:
        throw Error(
          "Unable to handle request of type " +
            contentTypeInfo.type.toLowerCase(),
        );
    }
  } catch (error) {
    return res.setStatus(500).send(error.message);
  }

  // 4. RETURN TO CALLER
  res.sendStatus(200).end();

  console.log(
    `${BREAK}^^ HTTP ${req.method.toUpperCase()} LOGGED @ ${new Date()} ^^${BREAK}`,
  );
}

/**
 * A middleware function that just prints back a raw HTTP request without
 * attempting to understand the structure of the body
 */
async function echoRaw(
  req: OpineRequest,
  res: OpineResponse,
  _next: NextFunction,
) {
  const echo = await initialiseEcho();

  // Method & URL
  await echo(`${req.method.toUpperCase()} ${req.url} HTTP/1.1`);

  // Headers
  const headers = formatHeaders(req.headers);
  await echo(headers);

  await echo(EMPTY);

  // Body
  // TODO: Deal with deflate and gzip, content-encoding
  const body = await formatBody(req.body);
  await echo(body);

  res.sendStatus(200).end();

  console.log(
    `${BREAK}^^ MULTIPART POST LOGGED @ ${new Date()} ^^${BREAK}`,
  );
}

export default (() => {
  const router = Router();
  router.post("/multipart", echoAfterParsing);
  router.post("/raw", echoRaw);
  router.post("/ping", (_req: OpineRequest, res: OpineResponse) => {
    res.sendStatus(200);
  });
  return router;
})();
