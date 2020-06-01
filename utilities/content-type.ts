
type ContentTypeHeaderInformation = {
  mediaType: string;
  type: string;
  subType: string;
  parameters?: Record<string, string>
} | null;

export default function parseContentType(contentTypeHeader: string) : ContentTypeHeaderInformation {

  const PARSER = /^([-\w]+)\/([-\w]+)\s*(?:;(\w+)=(\S+|"\S+"))*/g;
  let parsed = PARSER.exec(contentTypeHeader);

  if (!parsed || parsed.length < 3) return null;

  const mediaTypeOnly = ((type, subType) => ({
    mediaType: `${type}/${subType}`,
    type,
    subType
  }))(parsed[1].toLowerCase(), parsed[2].toLowerCase());

  const remainingMatches = parsed.length - 3;

  if (remainingMatches === 0 || remainingMatches % 2 === 1) {
    return mediaTypeOnly;
  }

  const parameters : Record<string, string> = {};

  const mediaTypeAndParameters = {
    ...mediaTypeOnly,
    parameters
  };

  const parameterTokens = parsed.slice(3);

  for (let i = 0; i < remainingMatches; i += 2) {
    const name = parameterTokens[i];
    const value = parameterTokens[i + 1];
    mediaTypeAndParameters.parameters[name] = value;
  }

  return mediaTypeAndParameters; 

}
