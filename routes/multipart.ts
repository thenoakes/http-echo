import { Request, parseMultipartRelated, Colors } from "../deps.ts";
import { initialiseEcho } from "./index.ts";
import { BREAK } from "../utilities/strings.ts";
import parseContentType from "../utilities/content-type.ts";
import { ContentTypeHeaderInformation } from "../utilities/content-type.ts";
import {
  formatBody,
  formatHeaders,
  formatRequestLine,
} from "../formatters/http-formatters.ts";
import { Select } from "https://deno.land/x/cliffy/prompt.ts";

// https://www.iana.org/assignments/media-types/media-types.xhtml#multipart

/** Reads the subtype of the incoming request an calls an appopriate method to handle it */
export async function multipart(
  request: Request,
  contentTypeInfo: ContentTypeHeaderInformation
) {
  let boundary: string | undefined;
  switch (contentTypeInfo?.subType.toLowerCase()) {
    case "related":
      // https://tools.ietf.org/html/rfc2387
      boundary = contentTypeInfo.parameters?.boundary;
      if (boundary) return await multipartRelated(request, boundary);
    case "alternative":
      boundary = contentTypeInfo.parameters?.boundary;
      if (boundary) return await multipartAlternative(request, boundary);
    case "byteranges":
    case "digest":
    case "form-data":
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
export async function multipartRelated(request: Request, boundary: string) {
  // REQUIRED PARAMETERS: type (content-type of the root item)
  // OPTIONAL PARAMETERS: start, start-info

  const echo = await initialiseEcho();

  // Request Line and Headers
  const preamble =
    formatRequestLine(request) + BREAK + formatHeaders(request.headers);
  await echo(preamble);

  const wholeBody = await formatBody(request.body);

  const bodyParts = await parseMultipartRelated(wholeBody, boundary);

  // Body
  for (let part of bodyParts) {
    await echo(BREAK + "--" + boundary);
    await echo(formatHeaders(part.headers));
    await echo(BREAK + part.content.trimEnd());
  }
  await echo(BREAK + "--" + boundary + "--");
}

export async function multipartAlternative(request: Request, boundary: string) {
  const wholeBody = await formatBody(request.body);
  let bodyParts = await parseMultipartRelated(wholeBody, boundary);
  bodyParts = bodyParts.reverse();
  
  console.log(Colors.blue("multipart/alternative"), "request received at");
  console.log(formatRequestLine(request));
  console.log(
    Colors.gray(
      `containing ${bodyParts.length} alternative representations of the content with increasingly generic MIME types.`
    ),
    BREAK
  );

  const options = bodyParts.map((bp, i) => ({
    name:
      i.toString() +
      ". " +
      parseContentType(
        bp.headers["content-type"] || bp.headers["Content-Type"] || ""
      )?.mediaType,
    value: i.toString(),
  }));

  const choice: string = await Select.prompt({
    message:
      "You should select the first part which has a MIME type you can consume",
    options: options.filter((o) => o.name !== undefined),
  });

  console.log(BREAK + formatHeaders(bodyParts[parseInt(choice)].headers));
  console.log(bodyParts[parseInt(choice)].content);
}
