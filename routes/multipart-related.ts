import { Request, parseMultipartRelated } from "../deps.ts";
import { initialiseEcho }  from './index.ts';
import { BREAK } from '../utilities/strings.ts';
import { ContentTypeHeaderInformation }  from '../utilities/content-type.ts';
import { formatBody, formatHeaders, formatRequestLine } from '../formatters/http-formatters.ts';

/** Specific logic for processing multipart/related content-type */
export async function multipartRelated(request: Request, contentTypeInfo: ContentTypeHeaderInformation) {
  const echo = await initialiseEcho();

  // Request Line and Headers
  const preamble = formatRequestLine(request) + BREAK + formatHeaders(request.headers);
  await echo(preamble);

  const wholeBody = await formatBody(request.body);

  const multipartBoundary = contentTypeInfo!.parameters?.boundary!;
  const bodyParts = await parseMultipartRelated(wholeBody, multipartBoundary);

  // Body
  for (let part of bodyParts) {
    await echo(BREAK + "--" + multipartBoundary);
    for (let header in part.headers) {
      await echo(header + ": " + part.headers[header]);
    }
    await echo(BREAK + part.content.trimEnd());
  }
  await echo(BREAK + "--" + multipartBoundary + "--");

}