import { createToken, Lexer } from "chevrotain";

// import { unquotify_string } from "../unicode";

export const ObjectStart = createToken({ name: "OpenBracket", pattern: /{/ });
export const ObjectEnd = createToken({ name: "CloseBracket", pattern: /}/ });
export const ArrayStart = createToken({ name: "ArrayStart", pattern: /\(/ });
export const ArrayEnd = createToken({ name: "ArrayEnd", pattern: /\)/ });
export const Terminator = createToken({ name: "Terminator", pattern: /;/ });
export const Separator = createToken({ name: "Separator", pattern: /,/ });
export const Colon = createToken({ name: "Colon", pattern: /=/ });

function matchQuotedString(text: string, startOffset: number) {
  let quote = text.charAt(startOffset);
  if (quote !== `'` && quote !== `"`) {
    return null;
  }

  const reg = new RegExp(
    `${quote}(?:[^\\\\${quote}]|\\\\(?:[bfnrtv${quote}\\\\/]|u[0-9a-fA-F]{4}))*${quote}`,
    "y"
  );

  // using 'y' sticky flag (Note it is not supported on IE11...)
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/sticky
  reg.lastIndex = startOffset;

  // Note that just because we are using a custom token pattern
  // Does not mean we cannot implement it using JavaScript Regular Expressions...
  const execResult = reg.exec(text);
  if (execResult !== null) {
    const fullMatch = execResult[0];
    // compute the payload
    const matchWithOutQuotes = fullMatch.substring(1, fullMatch.length - 1);
    // const matchWithOutQuotes = unquotify_string(fullMatch);
    // attach the payload

    // @ts-expect-error
    execResult.payload = matchWithOutQuotes;
  }

  return execResult;
}

const dataLiteralPattern = /<[0-9a-fA-F\s]+>/y;

function matchData(text: string, startOffset: number) {
  if (text.charAt(startOffset) !== `<`) {
    return null;
  }

  // using 'y' sticky flag (Note it is not supported on IE11...)
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/sticky
  dataLiteralPattern.lastIndex = startOffset;

  // Note that just because we are using a custom token pattern
  // Does not mean we cannot implement it using JavaScript Regular Expressions...
  const execResult = dataLiteralPattern.exec(text);
  if (execResult !== null) {
    const fullMatch = execResult[0];
    // compute the payload
    const matchWithOutQuotes = fullMatch
      .substring(1, fullMatch.length - 2)
      .trim();
    // attach the payload
    // @ts-expect-error
    execResult.payload = Buffer.from(matchWithOutQuotes);
    // TODO: validate buffer (even number)
  }

  return execResult;
}

export const DataLiteral = createToken({
  name: "DataLiteral",
  pattern: { exec: matchData },
  line_breaks: false,
  start_chars_hint: [`<`],
});

export const QuotedString = createToken({
  name: "QuotedString",
  pattern: { exec: matchQuotedString },
  line_breaks: false,
  // Optional property that will enable optimizations in the lexer
  // See: https://chevrotain.io/documentation/10_1_2/interfaces/itokenconfig.html#start_chars_hint
  start_chars_hint: [`"`, `'`],
});

export const StringLiteral = createToken({
  name: "StringLiteral",
  pattern: /[\w_$/:.-]+/,
  line_breaks: false,
});

export const WhiteSpace = createToken({
  name: "WhiteSpace",
  pattern: /[ \t\n\r]+/u,
  // pattern: /[ \t\n\r\x0A\x0D\u{2028}\u{2029}\x09\x0B\x0C\x20]+/u,
  group: Lexer.SKIPPED,
});

const AbsComment = createToken({ name: "AbsComment", pattern: Lexer.NA });

export const Comment = createToken({
  name: "Comment",
  pattern: /\/\/.*/,
  categories: AbsComment,
  group: Lexer.SKIPPED,
});

export const MultipleLineComment = createToken({
  name: "MultipleLineComment",
  pattern: /\/\*[^*]*\*+([^/*][^*]*\*+)*\//,
  categories: AbsComment,
  // note that comments could span multiple lines.
  // forgetting to enable this flag will cause inaccuracies in the lexer location tracking.
  line_breaks: true,
  group: Lexer.SKIPPED,
});

// Labels only affect error messages and Diagrams.
ObjectStart.LABEL = "'{'";
ObjectEnd.LABEL = "'}'";
ArrayStart.LABEL = "'('";
ArrayEnd.LABEL = "')'";
Terminator.LABEL = "';'";
Colon.LABEL = "'='";
Separator.LABEL = "','";

export default [
  // the order is important !!!!
  WhiteSpace,

  // Comments
  Comment,
  MultipleLineComment,

  // etc..
  ObjectStart,
  ObjectEnd,
  ArrayStart,
  ArrayEnd,
  Terminator,
  Separator,
  Colon,

  // Data Types
  DataLiteral,
  QuotedString,
  StringLiteral,
];
