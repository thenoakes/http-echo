import { getLines } from './textLines.ts';

/** Returns an async function which, when called, will execute an HTTP request equivalent to 
 * the one passed in as a raw string
 */
export function fetchFromRaw(txt : string) {

  let _body = "";
  let _host: string | undefined;
  let _path : string | undefined;
  let _method : string | undefined;
  let _version : string | undefined;
  let _headers : Record<string, string> = {};

  const methods = [
    "GET",
    "POST",
    "PATCH",
    "PUT",
    "DELETE",
    "HEAD",
    "OPTIONS"
  ];

  let lines = getLines(txt);

  // Remove leading blank lines - this is not part of HTTP spec but is for my convenience :)
  if (lines[0].isBlank) {
    const start = lines.findIndex(l => !l.isBlank);
    lines = lines.slice(start);
  }

  // Search for the start of body content
  const separatingLine = lines.findIndex(t => t.isBlank);

  // Search through the request for configuration options
  lines.forEach((line, number) => {

    const content = line.content;

    if (!content.includes(":")) {
      // Search for the request line
      let index;
      methods.forEach(method => {
        let tmpIndex = content.indexOf(method);   
        if (tmpIndex > -1) {
          if (!_method) {

            index = tmpIndex;
            let words = content.split(" ");

            _method = content.substring(tmpIndex, tmpIndex + method.length);
            _method = _method && _method.trim();

            _path = words.find(word => word[0] === "/")
            _path = _path && _path.trim();

            _version = content
              .replace(_method, "")
              .replace(_path || "", "");
            _version = _version && _version.trim();
          }    
        }
      });
    } else {
      // Search for headers
      let indexOfColon = content.indexOf(":");
      if (indexOfColon > 0 && indexOfColon < content.length - 1 && number <= separatingLine) {
        let key = content.substring(0, indexOfColon).trim();
        let value = content.substring(indexOfColon + 1).trim();
        _headers[key] = value;
        if (key.toLowerCase() == "host") {
          _host = value;
        }
   	  }
    }

  });

  // Ensure CRLF line endings are used (reading from a variable will probably use LF)
  _body = lines.slice(separatingLine + 1)
    .map(l => l.content.trim())
    .join('\r\n');

  const fetchDetails : RequestInit = {
    body: _body,
    headers: _headers,
    method: _method
  };

  const url = new URL(`http://${_host}${_path}`);

  return async () => fetch(url, fetchDetails);
}
  
