export interface ErrorHash {
  loc: {
    first_line: number;
    last_line: number;
    first_column: number;
    last_column: number;
  };
}

export interface MarkerData {
  severity: number;
  message: string;
  source?: string;
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

export type ParsedError = {
  error: Error;
  marker?: MarkerData;
};

export function handleParseError(error: Error, content: string) {
  let marker: MarkerData | undefined;
  if ('hash' in error) {
    try {
      let errorString = error.toString();
      const errorLineText = extractErrorLineText(errorString);
      const realLineNumber = findMostRelevantLineNumber(errorLineText, content);

      let first_line: number,
        last_line: number,
        first_column: number,
        last_column: number;
      try {
        ({ first_line, last_line, first_column, last_column } = (
          error.hash as ErrorHash
        ).loc);
      } catch {
        const lineNo = findMostRelevantLineNumber(errorString, content);
        first_line = lineNo;
        last_line = lineNo + 1;
        first_column = 0;
        last_column = 0;
      }

      if (realLineNumber !== -1) {
        errorString = replaceLineNumberInErrorMessage(
          errorString,
          realLineNumber,
        );
      }

      marker = {
        severity: 8, // Error
        startLineNumber: realLineNumber,
        startColumn: first_column,
        endLineNumber: last_line + (realLineNumber - first_line),
        endColumn: last_column + (first_column === last_column ? 0 : 5),
        message: errorString || 'Syntax error',
      };
    } catch (error) {
      console.error('Error without line helper', error);
    }
  }

  return {
    marker,
    error: new Error(error.toString()),
  };
}

export function extractErrorLineText(errorMessage: string): string {
  const regex = /Error: Parse error on line \d+:\n(.+)\n+/;
  const match = errorMessage.match(regex);
  if (match) {
    return match[1].slice(3);
  }

  const regexLex =
    /Error: Lexical error on line \d+. Unrecognized text.\n(.+)\n-+/;
  const matchLex = errorMessage.match(regexLex);
  return matchLex ? matchLex[1].slice(3) : '';
}

// Function to replace the incorrect line number in the error message
export function replaceLineNumberInErrorMessage(
  errorMessage: string,
  realLineNumber: number,
): string {
  const regexParseError = /Parse error on line (\d+):/;
  const regexLexError = /Lexical error on line (\d+)/;
  return errorMessage
    .replace(regexParseError, `Parse error on line ${realLineNumber}:`)
    .replace(regexLexError, `Lexical error on line ${realLineNumber}:`);
}

// Function to find the line number with the most characters in common with the error
export function findMostRelevantLineNumber(
  errorLineText: string,
  code: string,
): number {
  const codeLines = code.split('\n');
  let mostRelevantLineNumber = -1;
  let maxCommonLength = 0;

  for (const [i, line] of codeLines.entries()) {
    let commonLength = 0;
    for (let j = 0; j <= errorLineText.length; j++) {
      for (let k = j + 1; k <= errorLineText.length; k++) {
        const sub = errorLineText.slice(j, k);
        if (line.includes(sub)) {
          commonLength = Math.max(commonLength, sub.length);
        }
      }
    }
    if (commonLength > maxCommonLength) {
      maxCommonLength = commonLength;
      mostRelevantLineNumber = i + 1; // Line numbers start from 1
    }
  }
  return mostRelevantLineNumber;
}
