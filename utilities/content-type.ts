import type { ParsedToken } from "deno-standalone-parser";
import { TokenAnalyser as Analyser } from "deno-standalone-parser";

/** An enum which classifies the various 'tokens' that appear in the header */
export enum Token {
  Type1 = "type",
  TypeSep = "type-separator",
  Type2 = "subtype",
  WS1 = "post-subtype-whitespace",
  BeginParam = "parameter-separator",
  WS2 = "pre-parameter-whitespace",
  Name = "parameter-name",
  Equals = "name-value-separator",
  OpenQuote = "value-open-quote",
  Value = "unquoted-parameter-value",
  QuotedValue = "quoted-parameter-value",
  CloseQuote = "value-close-quote",
  Terminator = "terminator",
}

// TODO: Update to match https://www.w3.org/Protocols/rfc1341/4_Content-Type.html

/** An enum which classifies various unicode characters into groups */
export enum Group {
  Unrecognised = "unrecognised",

  // tspecials with particular significance
  Quote = "quote",
  Equals = "equals",
  Semicolon = "semicolon",
  ForwardSlash = "forwardslash",

  // TODO: other tspecials
  // OpenParenthesis = 'openparenthesis',
  // CloseParenthesis = 'closeparenthesis',
  // LessThan = 'lessthan',
  // GreaterThan = 'greaterthan',
  // At = 'at',
  // Comma = 'comma',
  // Colon = 'colon',
  // BackSlash = 'backslash',
  // OpenBracket = 'openbracket',
  // CloseBracket = 'closebracket',
  // QuestionMark = 'questionmark',
  // Dot = 'dot',

  // tokens
  Letter = "letter",
  Numeral = "numeral",
  Hyphen = "hyphen",
  OtherSymbol = "symbol",

  Whitespace = "whitespace",
  Null = "null",
}

/** Classify a character according to the Char enum */
function getGroup(character: string) {
  const char = character.charAt(0);
  if (char === "\0") return Group.Null;
  if (/^-$/.test(char)) return Group.Hyphen;
  if (/^"$/.test(char)) return Group.Quote;
  if (/^=$/.test(char)) return Group.Equals;
  if (/^;$/.test(char)) return Group.Semicolon;
  if (/^\s$/.test(char)) return Group.Whitespace;
  if (/^\/$/.test(char)) return Group.ForwardSlash;
  if (/^[a-zA-Z]$/.test(char)) return Group.Letter;
  if (/^[0-9]$/.test(char)) return Group.Numeral;
  return Group.OtherSymbol;
  //return Character.Unrecognised;
}

/** HTTP Content-Type HEADER TOKENS:
 * - 'Type1' : A string indicating the first part of the MIME type
 * - 'TypeSep' : A single forward slash character which separates two parts of the type
 * - 'Type2' : A string indicating the second part (i.e. subtype) of the MIME type
 * - 0 or more sequences of:
 *     - 'WS1' : Optional whitespace
 *     - 'BeginParam' : A single semicolon character which separates a parameter from what comes before it
 *     - 'WS2' : Optional whitespace
 *     - 'Name' : A string indicating the name of a parameter
 *     - 'Equals' : A single equals character which separates a parameter name from its value
 * - Followed by either:
 *     - 'UnquotedValue' : A string indicating the value of the parameter (potentally from a limited character set?)
 * - Or:
 *     - 'OpenQuote' : A single quote character which delmits the start of the parameter value
 *     - 'QuotedValue' : A string indicating the value of the parameter (potentially from a larger character set?)
 *     - 'CloseQuote' : A single quote character which delimits the end of a parameter value
 */

export default function parseContentType(
  contentTypeHeader: string,
): ContentTypeHeaderInformation {
  // Configure a token analyser for Content-Type
  const analyser = Analyser<string, string>(getGroup)
    .whenTokenIs(Token.Type1)
    .legalCharacters(Group.Letter, Group.Hyphen)
    .legalTransition(Group.Letter, Group.ForwardSlash, Token.TypeSep)
    .whenTokenIs(Token.TypeSep)
    .legalTransition(Group.ForwardSlash, Group.Letter, Token.Type2)
    .whenTokenIs(Token.Type2)
    .legalCharacters(Group.Letter, Group.Hyphen)
    .legalTransition(Group.Letter, Group.Whitespace, Token.WS1)
    .legalTransition(Group.Letter, Group.Semicolon, Token.BeginParam)
    .legalTransition(Group.Letter, Group.Null, Token.Terminator)
    .whenTokenIs(Token.WS1)
    .legalCharacters(Group.Whitespace)
    .legalTransition(Group.Whitespace, Group.Semicolon, Token.BeginParam)
    .legalTransition(Group.Whitespace, Group.Null, Token.Terminator)
    .whenTokenIs(Token.BeginParam)
    .legalTransition(Group.Semicolon, Group.Whitespace, Token.WS2)
    .legalTransition(Group.Semicolon, Group.Letter, Token.Name)
    .whenTokenIs(Token.WS2)
    .legalCharacters(Group.Whitespace)
    .legalTransition(Group.Whitespace, Group.Letter, Token.Name)
    .whenTokenIs(Token.Name)
    .legalCharacters(Group.Letter)
    .legalTransition(Group.Letter, Group.Equals, Token.Equals)
    .whenTokenIs(Token.Equals)
    .legalTransition(Group.Equals, Group.Quote, Token.OpenQuote)
    .legalTransition(Group.Equals, [Group.Letter, Group.Numeral], Token.Value)
    .whenTokenIs(Token.OpenQuote)
    .legalTransition(Group.Quote, [
      Group.Letter,
      Group.Whitespace,
      Group.Numeral,
      Group.Hyphen,
      Group.OtherSymbol,
      Group.Whitespace,
      Group.ForwardSlash,
    ], Token.QuotedValue)
    .whenTokenIs(Token.QuotedValue)
    .legalCharacters(
      Group.Letter,
      Group.Whitespace,
      Group.Numeral,
      Group.Hyphen,
      Group.OtherSymbol,
      Group.Whitespace,
      Group.ForwardSlash,
    )
    .legalTransition(
      [
        Group.Letter,
        Group.Whitespace,
        Group.Numeral,
        Group.Hyphen,
        Group.OtherSymbol,
        Group.Whitespace,
        Group.ForwardSlash,
      ],
      Group.Quote,
      Token.CloseQuote,
    )
    .whenTokenIs(Token.Value)
    .legalCharacters(
      Group.Letter,
      Group.Numeral,
      Group.Hyphen,
      Group.OtherSymbol,
    )
    .legalTransition(
      [Group.Letter, Group.Numeral, Group.Hyphen, Group.OtherSymbol],
      Group.Whitespace,
      Token.WS1,
    )
    .legalTransition(
      [Group.Letter, Group.Numeral, Group.Hyphen, Group.OtherSymbol],
      Group.Semicolon,
      Token.BeginParam,
    )
    .legalTransition(
      [Group.Letter, Group.Numeral, Group.Hyphen, Group.OtherSymbol],
      Group.Null,
      Token.Terminator,
    )
    .whenTokenIs(Token.CloseQuote)
    .legalTransition(Group.Quote, Group.Whitespace, Token.WS1)
    .legalTransition(Group.Quote, Group.Semicolon, Token.BeginParam)
    .legalTransition(Group.Quote, Group.Null, Token.Terminator);

  // Parse the Content-Type header into a set of tokens
  const result = analyser.analyse(contentTypeHeader, Token.Type1);

  // Process the parsed tokens into a return object
  return processResult(result);
}

export type ContentTypeHeaderInformation = {
  mediaType: string;
  type: string;
  subType: string;
  parameters?: Record<string, string>;
} | null;

/** A post-processor for the Content-Type header which summarises the parsed tokens */
function processResult(
  result: ParsedToken<string>[],
): ContentTypeHeaderInformation {
  const tokens = result
    .filter((t) =>
      [Token.Type1, Token.Type2, Token.Name, Token.Value, Token.QuotedValue]
        .map((t) => t as string)
        .includes(t.type)
    );

  if (
    [
      tokens[0].type === Token.Type1,
      tokens[0].value.length,
      tokens[1].type === Token.Type2,
      tokens.slice(2).filter((_, i) => i % 2 === 0).every((t) =>
        t.type === Token.Name
      ),
      tokens.slice(2).filter((_, i) => i % 2 === 1).every((t) =>
        [Token.Value, Token.QuotedValue]
          .map((t) => t as string)
          .includes(t.type)
      ),
    ].some((assert) => !assert)
  ) {
    console.error("Parsed result does not represent a correct content-type");
    return null;
  } else {
    const parseResult: ContentTypeHeaderInformation = {
      mediaType: `${tokens[0].value}/${tokens[1].value}`.toLowerCase(),
      type: tokens[0].value.toLowerCase(),
      subType: tokens[1].value.toLowerCase(),
    };

    if (tokens.slice(2).length) {
      const parameters: Record<string, string> = {};
      tokens.slice(2).reduce((prev, current, index) => {
        if (index % 2 === 1) {
          parameters[prev.value.toLowerCase()] = current.value;
        }
        return current;
      }, tokens.slice(2)[0]);
      parseResult.parameters = parameters;
    }
    return parseResult;
  }
}
