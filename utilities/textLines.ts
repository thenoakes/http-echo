export enum LineEnding {
  CR,
  LF,
  CRLF,
  Unterminated
}

export type TextLine = {
  length: number;
  content: string;
  isBlank: boolean;
  ending: LineEnding;
}

export function getEnding(type : LineEnding) {
  if (type === LineEnding.CR) return '\r';
  if (type === LineEnding.LF) return '\n';
  if (type === LineEnding.CRLF) return '\r\n';
  return '';
}

export function classifyEnding(sequence : string) {
  if (sequence === '\r') return LineEnding.CR;
  if (sequence === '\n') return LineEnding.LF;
  if (sequence === '\r\n') return LineEnding.CRLF;
  if (!sequence.length) return LineEnding.Unterminated;
}

/**
 * Parses a string into its component lines, returning an object for each line
 * containing its content, its line-ending terminator and information on its length
 */
export function getLines(txt: string) {

  const parsedLines : TextLine[] = [];
  const rawLines = txt.matchAll(/.*(?:\r\n|\r|\n|$)/g);

  for (let match of rawLines) {
    const rawLine = match[0]!;
    const lineContent = rawLine.trimEnd();
    const lineEnding = rawLine.match(/\r\n|\r|\n/)!;
    let endingType = LineEnding.Unterminated;
    if (lineEnding) {
      endingType = classifyEnding(lineEnding[0]) || LineEnding.Unterminated;
    }
    
    parsedLines.push({
      ending: endingType,
      content : lineContent,
      length : lineContent.length,
      isBlank : lineContent.length === 0
    });
  }

  return parsedLines;
}