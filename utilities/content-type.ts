
type ContentTypeHeaderInformation = {
  mediaType: string;
  type: string;
  subType: string;
  parameters?: Record<string, string>
} | null;

export default function parseContentType(contentTypeHeader: string) : ContentTypeHeaderInformation {

  const PARSER = /^([-\w]+)\/([-\w]+)\s*(?:;(\w+=\S+|"\S+"))*/g;
  let parsed = PARSER.exec(contentTypeHeader);

  if (!parsed || parsed.length < 3) return null;

  const mediaTypeOnly = ((type, subType) => ({
    mediaType: `${type}/${subType}`,
    type,
    subType
  }))(parsed[1].toLowerCase(), parsed[2].toLowerCase());

  const remainingMatches = parsed.length - 3;

  if (remainingMatches !== 1) {
    return mediaTypeOnly;
  }

  const parameters : Record<string, string> = {};

  const mediaTypeAndParameters = {
    ...mediaTypeOnly,
    parameters
  };

  const parameterTokens = parsed[3].split(";");

  for (let i = 0; i < parameterTokens.length; i++) {
    const [name, value] = parameterTokens[i].split("=");
    mediaTypeAndParameters.parameters[name] = value.replace(/^"(.*)"$/, '$1');
  }

  return mediaTypeAndParameters; 

}
