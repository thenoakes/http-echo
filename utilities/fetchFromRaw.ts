import { getLines } from "./textLines.ts";

const methods = [
  "GET",
  "POST",
  "PATCH",
  "PUT",
  "DELETE",
  "HEAD",
  "OPTIONS",
];

/** Returns an async function which, when called, will execute an HTTP request equivalent to
 * the one passed in as a raw string
 */
export function fetchFromRaw(txt: string) {
  let _body = "";
  let _host: string | undefined;
  let _path: string | undefined;
  let _method: string | undefined;
  let _version: string | undefined;
  const _headers: Record<string, string> = {};

  let lines = getLines(txt);

  // Remove leading blank lines - this is not part of HTTP spec but is for my convenience :)
  if (lines[0].isBlank) {
    const start = lines.findIndex((l) => !l.isBlank);
    lines = lines.slice(start);
  }

  // Search for the start of body content
  const separatingLine = lines.findIndex((t) => t.isBlank);

  // Search through the request for configuration options
  lines.forEach((line, lineNumber) => {
    const content = line.content;

    if (!content.includes(":")) {
      // Search for the request line
      methods.forEach((method) => {
        const idx = content.indexOf(method);
        if (idx > -1 && !_method) {
          const words = content.split(" ");

          const m = content.substring(idx, idx + method.length);
          _method = m && m.trim();

          const p = words.find((word) => word[0] === "/");
          _path = p && p.trim();

          const v = content
            .replace(_method, "")
            .replace(_path || "", "");
          _version = v && v.trim();
        }
      });
    } else {
      // Search for headers
      const indexOfColon = content.indexOf(":");
      if (
        lineNumber <= separatingLine &&
        indexOfColon > 0 && indexOfColon < content.length - 1
      ) {
        const key = content.substring(0, indexOfColon).trim();
        const value = content.substring(indexOfColon + 1).trim();
        _headers[key] = value;
        if (key.toLowerCase() == "host") {
          _host = value;
        }
      }
    }
  });

  // Ensure CRLF line endings are used (reading from a variable will probably use LF)
  _body = lines.slice(separatingLine + 1)
    .map((l) => l.content.trim())
    .join("\r\n");

  const fetchDetails: RequestInit = {
    body: _body,
    headers: _headers,
    method: _method,
  };

  const url = new URL(`http://${_host}${_path}`);

  return async () => await fetch(url, fetchDetails);
}
