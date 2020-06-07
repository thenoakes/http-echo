
/** An enum which classifies the various 'tokens' that appear in the header */
enum Token {
  Type1 = 'type',
  TypeSep = 'type-separator',
  Type2 = 'subtype',
  WS1 = 'post-subtype-whitespace',
  BeginParam = 'parameter-separator',
  WS2 = 'pre-parameter-whitespace',
  Name = 'parameter-name',
  Equals = 'name-value-separator',
  OpenQuote = 'value-open-quote',
  Value = 'unquoted-parameter-value',
  QuotedValue = 'quoted-parameter-value',
  CloseQuote = 'value-close-quote',
  Terminator = 'terminator'
}

/** An enum which classifies various unicode characters into groups */
enum Group {
  Unrecognised = 'unrecognised',
  Quote = 'quote',
  Letter = 'letter',
  Numeral = 'numeral',
  Equals = 'equals',
  Hyphen = 'hyphen',
  Semicolon = 'semicolon',
  Whitespace = 'whitespace',
  ForwardSlash = 'forwardslash',
  Symbol = 'symbol',
  Null = 'null'
}

export type ContentTypeHeaderInformation = {
  mediaType: string;
  type: string;
  subType: string;
  parameters?: Record<string, string>
} | null;

type ParsedToken = {
  type: Token;
  value: string;
}

/** Classify a character according to the Char enum */
function getGroup(character: string) {
  const char = character.charAt(0);
  if (char === '\0') return Group.Null;
  if (/^-$/.test(char)) return Group.Hyphen;
  if (/^"$/.test(char)) return Group.Quote;
  if (/^=$/.test(char)) return Group.Equals;
  if (/^;$/.test(char)) return Group.Semicolon;
  if (/^\s$/.test(char)) return Group.Whitespace;
  if (/^\/$/.test(char)) return Group.ForwardSlash;
  if (/^[a-zA-Z]$/.test(char)) return Group.Letter;
  if (/^[0-9]$/.test(char)) return Group.Numeral;
  return Group.Symbol;
  //return Character.Unrecognised;
}

/** Returns true only if the passed transition array represents the transition between the supplied Char values */
function is(transition : [Group, Group], from: Group, to: Group) {
  return transition.length === 2 && transition[0] === from && transition[1] === to;
}

/** HTTP Content-Type HEADER TOKENS:
 * 'Type1' : A string indicating the first part of the MIME type
 * 'TypeSep' : A single forward slash character which separates two parts of the type
 * 'Type2' : A string indicating the second part (i.e. subtype) of the MIME type
 * 0 or more sequences of:
 *   'WS1' : Optional whitespace
 *   'BeginParam' : A single semicolon character which separates a parameter from what comes before it
 *   'WS2' : Optional whitespace
 *   'Name' : A string indicating the name of a parameter
 *   'Equals' : A single equals character which separates a parameter name from its value
 *   Followed by either:
 *     'UnquotedValue' : A string indicating the value of the parameter (potentally from a limited character set?)
 *   Or: 
 *     'OpenQuote' : A single quote character which delmits the start of the parameter value
 *     'QuotedValue' : A string indicating the value of the parameter (potentially from a larger character set?)
 *     'CloseQuote' : A single quote character which delimits the end of a parameter value
 */

/**
 * Produces an object which encapsulates all of the information from an HTTP Content-Type header
 * @param {string} contentTypeHeader The full Content-Type HTTP header as a string
 * @param {Token} initialToken This should never be overridden
 */
export default function parseContentType(
  contentTypeHeader: string, initialToken: Token = Token.Type1) : ContentTypeHeaderInformation {

  /** Stack of all of the tokens logged by the parser */
  let parsedTokens : ParsedToken[] = [];

  let currentToken = initialToken;
  let currentGroup = Group.Letter;

  /** Construct the 'array' of characters by removing edge whitespace and the 
   * first character, then adding a null terminator */
  const to_parse = contentTypeHeader.trim().slice(1) + '\0';
  
  /** Holds the current value of each token as it is built up */
  let runningValue = contentTypeHeader.charAt(0);

  for (let nextCharacter of to_parse) {

    /** An array representing the previous and current character groups  */
    const transition : [Group, Group] = [currentGroup, getGroup(nextCharacter)];

    /** 
     * If the current 'transition' is between any two characters from the from and to arrays respectively:
     * - pushes the previous token to the stack if this is is a new token and resets the running value
     * - updates the running value with the new character and updates the token type
     * Additionally returns true when a match is found, to prevent further processing.
     */
    function transitionTo(newToken : Token, from : Group[], to : Group[]) {      
      const combinations = from.flatMap(f => to.map(t => [f, t]));
      if (combinations.some(c => is(transition, c[0], c[1]))) {
        if (currentToken !== newToken) {
          parsedTokens.push({
            type: currentToken,
            value: runningValue
          });
          runningValue = '';
        }
        runningValue += nextCharacter;
        currentToken = newToken; // Remember, the 'new' token may well be the same as the current
        return true;
      }
      return false;
    }

    /** Throws when an unexpected character is encountered, to abort parsing */
    function illegal() {
      throw Error('Illegal transition ' + JSON.stringify(transition) + ' when parsing ' + currentToken);
    }

    // LOGIC

    switch (currentToken) {

      // TODO: Clean up syntax with some clever abstraction :)

      case Token.Type1:
        transitionTo(Token.Type1, 
          [Group.Letter, Group.Hyphen], [Group.Letter, Group.Hyphen]) ||
        transitionTo(Token.TypeSep, 
          [Group.Letter], [Group.ForwardSlash]) ||
        illegal();
        break;   

      case Token.TypeSep:
        transitionTo(Token.Type2,
          [Group.ForwardSlash], [Group.Letter]) ||
        illegal();
        break;

      case Token.Type2:
        transitionTo(Token.Type2,
          [Group.Letter, Group.Hyphen], [Group.Letter, Group.Hyphen]) ||
        transitionTo(Token.WS1,
          [Group.Letter], [Group.Whitespace]) ||
        transitionTo(Token.BeginParam,
          [Group.Letter], [Group.Semicolon]) ||
        illegal();
        break;

      case Token.WS1:
        transitionTo(Token.WS1,
          [Group.Whitespace], [Group.Whitespace]) ||
        transitionTo(Token.BeginParam,
          [Group.Whitespace], [Group.Semicolon]) ||
        illegal();
        break;

      case Token.BeginParam:
        transitionTo(Token.WS2,
          [Group.Semicolon], [Group.Whitespace]) ||
        transitionTo(Token.Name,
          [Group.Semicolon], [Group.Letter]) ||
        illegal();
        break;

      case Token.WS2:
        transitionTo(Token.WS2,
          [Group.Whitespace], [Group.Whitespace]) ||
        transitionTo(Token.Name,
          [Group.Whitespace], [Group.Letter]) ||
        illegal();
        break;

      case Token.Name:
        transitionTo(Token.Name,
          [Group.Letter], [Group.Letter]) ||
        transitionTo(Token.Equals,
          [Group.Letter], [Group.Equals]) ||
        illegal();
        break;

      case Token.Equals:
        transitionTo(Token.OpenQuote,
          [Group.Equals], [Group.Quote]) ||
        transitionTo(Token.Value,
          [Group.Equals], [Group.Letter]) ||
        illegal();
        break;

        case Token.OpenQuote:
          transitionTo(Token.QuotedValue,
            [Group.Quote], 
            [Group.Letter, Group.Whitespace, Group.Numeral, Group.Hyphen, Group.Symbol, Group.Whitespace, Group.ForwardSlash]) ||
          illegal();
          break;

        case Token.QuotedValue:
          transitionTo(Token.QuotedValue,
            [Group.Letter, Group.Whitespace, Group.Numeral, Group.Hyphen, Group.Symbol, Group.Whitespace, Group.ForwardSlash], 
            [Group.Letter, Group.Whitespace, Group.Numeral, Group.Hyphen, Group.Symbol, Group.Whitespace, Group.ForwardSlash]) ||
          transitionTo(Token.CloseQuote,
            [Group.Letter, Group.Whitespace, Group.Numeral, Group.Hyphen, Group.Symbol, Group.Whitespace, Group.ForwardSlash],
            [Group.Quote]) || 
          illegal();
          break;

        case Token.Value:
          transitionTo(Token.Value,
            [Group.Letter, Group.Numeral, Group.Hyphen, Group.Symbol], 
            [Group.Letter, Group.Numeral, Group.Hyphen, Group.Symbol]) ||
          transitionTo(Token.WS1,
            [Group.Letter, Group.Numeral, Group.Hyphen, Group.Symbol],
            [Group.Whitespace]) || 
          transitionTo(Token.BeginParam,
            [Group.Letter, Group.Numeral, Group.Hyphen, Group.Symbol],
            [Group.Semicolon]) || 
          transitionTo(Token.Terminator,
            [Group.Letter, Group.Numeral, Group.Hyphen, Group.Symbol],
            [Group.Null]) ||
          illegal();
          break;

        case Token.CloseQuote:
          transitionTo(Token.WS1,
            [Group.Quote], 
            [Group.Whitespace]) ||
          transitionTo(Token.BeginParam,
            [Group.Quote], 
            [Group.Semicolon]) ||
          transitionTo(Token.Terminator,
            [Group.Quote], 
            [Group.Null]) ||
          illegal();
          break;
    }

    currentGroup = transition[1];
  }

  console.log('Parsing complete.');
  //console.log(parsedTokens);

  const tokens = parsedTokens
    .filter(t => [Token.Type1, Token.Type2, Token.Name, Token.Value, Token.QuotedValue].includes(t.type));

  if ([
    tokens[0].type === Token.Type1, tokens[0].value.length,
    tokens[1].type === Token.Type2,
    tokens.slice(2).filter((e, i) => i % 2 === 0).every(t => t.type === Token.Name),
    tokens.slice(2).filter((e, i) => i % 2 === 1).every(t => [Token.Value, Token.QuotedValue].includes(t.type))
  ].some(assert => !assert)) {
    console.error('Parsed result does not represent a correct content-type');
    return null;
  }
  else {
    const parseResult : ContentTypeHeaderInformation = {
      mediaType: `${tokens[0].value}/${tokens[1].value}`.toLowerCase(),
      type: tokens[0].value.toLowerCase(),
      subType: tokens[1].value.toLowerCase()
    };

    if (tokens.slice(2).length) {
      const parameters : Record<string, string> = {};
      tokens.slice(2).reduce((prev, current, index, array) => {
        if (index % 2 === 1) parameters[prev.value.toLowerCase()] = current.value;
        return current;
      }, tokens.slice(2)[0]);
      parseResult.parameters = parameters;
    }
    return parseResult;
  }
}
