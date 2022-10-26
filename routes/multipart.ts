import type { OpineRequest } from "opine";
import { parseMultipartRelated } from "multipart-related-parser";
import { initialiseEcho } from "./index.ts";
import { BREAK } from "../utilities/strings.ts";
import { ContentTypeHeaderInformation } from "../utilities/content-type.ts";
import {
  formatBody,
  formatHeaders,
  formatRequestLine,
} from "../formatters/http-formatters.ts";

// https://www.iana.org/assignments/media-types/media-types.xhtml#multipart

/** Reads the subtype of the incoming request an calls an appopriate method to handle it */
export async function multipart(
  request: OpineRequest,
  contentTypeInfo: ContentTypeHeaderInformation,
) {
  switch (contentTypeInfo?.subType.toLowerCase()) {
    case "related":
    case "form-data":
      if (contentTypeInfo.parameters?.boundary) {
        return await multipartRelated(
          request,
          contentTypeInfo.parameters?.boundary,
        );
      }
      break;
    case "alternative":
    case "byteranges":
    case "digest":
    case "mixed":
    case "parallel":
    case "report":
    case "signed":
    case "encrypted":
    default:
      break;
  }
  throw Error("Unable to handle this request");
}

/** Specific logic for processing multipart/related content-type */
export async function multipartRelated(
  request: OpineRequest,
  boundary: string,
) {
  // REQUIRED PARAMETERS: type (content-type of the root item)
  // OPTIONAL PARAMETERS: start, start-info

  const echo = await initialiseEcho();

  // Request Line and Headers
  const preamble = formatRequestLine(request) + BREAK +
    formatHeaders(request.headers);
  await echo(preamble);

  const wholeBody = await formatBody(request.body);

  const bodyParts = await parseMultipartRelated(wholeBody, boundary);

  // Body
  for (const part of bodyParts) {
    await echo(BREAK + "--" + boundary);
    await echo(formatHeaders(part.headers));
    await echo(BREAK + part.content.trimEnd());
  }
  await echo(BREAK + "--" + boundary + "--");
}
