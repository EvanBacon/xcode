import { createToken, Lexer } from "./chevrotain";

// Complete NextStep/NeXTSTEP Unicode mappings for Xcode compatibility
// Based on http://ftp.unicode.org/Public/MAPPINGS/VENDORS/NEXT/NEXTSTEP.TXT
const NEXT_STEP_MAPPINGS: Record<number, number> = {
  0x80: 0x00a0, 0x81: 0x00c0, 0x82: 0x00c1, 0x83: 0x00c2, 0x84: 0x00c3, 0x85: 0x00c4,
  0x86: 0x00c5, 0x87: 0x00c7, 0x88: 0x00c8, 0x89: 0x00c9, 0x8a: 0x00ca, 0x8b: 0x00cb,
  0x8c: 0x00cc, 0x8d: 0x00cd, 0x8e: 0x00ce, 0x8f: 0x00cf, 0x90: 0x00d0, 0x91: 0x00d1,
  0x92: 0x00d2, 0x93: 0x00d3, 0x94: 0x00d4, 0x95: 0x00d5, 0x96: 0x00d6, 0x97: 0x00d9,
  0x98: 0x00da, 0x99: 0x00db, 0x9a: 0x00dc, 0x9b: 0x00dd, 0x9c: 0x00de, 0x9d: 0x00b5,
  0x9e: 0x00d7, 0x9f: 0x00f7, 0xa0: 0x00a9, 0xa1: 0x00a1, 0xa2: 0x00a2, 0xa3: 0x00a3,
  0xa4: 0x2044, 0xa5: 0x00a5, 0xa6: 0x0192, 0xa7: 0x00a7, 0xa8: 0x00a4, 0xa9: 0x2019,
  0xaa: 0x201c, 0xab: 0x00ab, 0xac: 0x2039, 0xad: 0x203a, 0xae: 0xfb01, 0xaf: 0xfb02,
  0xb0: 0x00ae, 0xb1: 0x2013, 0xb2: 0x2020, 0xb3: 0x2021, 0xb4: 0x00b7, 0xb5: 0x00a6,
  0xb6: 0x00b6, 0xb7: 0x2022, 0xb8: 0x201a, 0xb9: 0x201e, 0xba: 0x201d, 0xbb: 0x00bb,
  0xbc: 0x2026, 0xbd: 0x2030, 0xbe: 0x00ac, 0xbf: 0x00bf, 0xc0: 0x00b9, 0xc1: 0x02cb,
  0xc2: 0x00b4, 0xc3: 0x02c6, 0xc4: 0x02dc, 0xc5: 0x00af, 0xc6: 0x02d8, 0xc7: 0x02d9,
  0xc8: 0x00a8, 0xc9: 0x00b2, 0xca: 0x02da, 0xcb: 0x00b8, 0xcc: 0x00b3, 0xcd: 0x02dd,
  0xce: 0x02db, 0xcf: 0x02c7, 0xd0: 0x2014, 0xd1: 0x00b1, 0xd2: 0x00bc, 0xd3: 0x00bd,
  0xd4: 0x00be, 0xd5: 0x00e0, 0xd6: 0x00e1, 0xd7: 0x00e2, 0xd8: 0x00e3, 0xd9: 0x00e4,
  0xda: 0x00e5, 0xdb: 0x00e7, 0xdc: 0x00e8, 0xdd: 0x00e9, 0xde: 0x00ea, 0xdf: 0x00eb,
  0xe0: 0x00ec, 0xe1: 0x00c6, 0xe2: 0x00ed, 0xe3: 0x00aa, 0xe4: 0x00ee, 0xe5: 0x00ef,
  0xe6: 0x00f0, 0xe7: 0x00f1, 0xe8: 0x0141, 0xe9: 0x00d8, 0xea: 0x0152, 0xeb: 0x00ba,
  0xec: 0x00f2, 0xed: 0x00f3, 0xee: 0x00f4, 0xef: 0x00f5, 0xf0: 0x00f6, 0xf1: 0x00e6,
  0xf2: 0x00f9, 0xf3: 0x00fa, 0xf4: 0x00fb, 0xf5: 0x0131, 0xf6: 0x00fc, 0xf7: 0x00fd,
  0xf8: 0x0142, 0xf9: 0x00f8, 0xfa: 0x0153, 0xfb: 0x00df, 0xfc: 0x00fe, 0xfd: 0x00ff,
  0xfe: 0xfffd, 0xff: 0xfffd
};

const ESCAPE_MAP: Record<string, string> = {
  'a': '\x07', 'b': '\b', 'f': '\f', 'n': '\n', 'r': '\r', 't': '\t', 'v': '\v',
  '"': '"', "'": "'", '\\': '\\', '\n': '\n'
};

// Xcode-compatible Unicode escape handling based on CFOldStylePList.c
function stripQuotes(input: string): string {
  let result = "";
  let i = 0;
  
  while (i < input.length) {
    const char = input[i];
    if (char === '\\' && i + 1 < input.length) {
      const next = input[i + 1];
      
      if (ESCAPE_MAP[next]) {
        result += ESCAPE_MAP[next];
        i += 2;
      } else if (next === 'U' && i + 5 < input.length) {
        const hex = input.slice(i + 2, i + 6);
        if (/^[0-9a-fA-F]{4}$/.test(hex)) {
          result += String.fromCharCode(parseInt(hex, 16));
          i += 6;
        } else {
          result += char;
          i++;
        }
      } else if (/^[0-7]/.test(next)) {
        let octal = '';
        let j = i + 1;
        while (j < input.length && j < i + 4 && /^[0-7]$/.test(input[j])) {
          octal += input[j];
          j++;
        }
        const code = parseInt(octal, 8);
        const mapped = code >= 0x80 ? NEXT_STEP_MAPPINGS[code] || code : code;
        result += String.fromCharCode(mapped);
        i = j;
      } else {
        result += char + next;
        i += 2;
      }
    } else {
      result += char;
      i++;
    }
  }
  
  return result;
}

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

  // Simplified regex for quoted strings
  const reg = new RegExp(`${quote}([^${quote}\\\\]|\\\\.)*${quote}`, "y");
  reg.lastIndex = startOffset;

  const execResult = reg.exec(text);
  if (execResult !== null) {
    const fullMatch = execResult[0];
    const matchWithOutQuotes = stripQuotes(
      fullMatch.substring(1, fullMatch.length - 1)
    );
    // @ts-expect-error
    execResult.payload = matchWithOutQuotes;
  }

  return execResult;
}

function matchData(text: string, startOffset: number) {
  if (text.charAt(startOffset) !== `<`) {
    return null;
  }

  const dataLiteralPattern = /<[0-9a-fA-F\s]+>/y;
  dataLiteralPattern.lastIndex = startOffset;

  const execResult = dataLiteralPattern.exec(text);
  if (execResult !== null) {
    const fullMatch = execResult[0];
    const hexData = fullMatch.substring(1, fullMatch.length - 1).trim();
    // @ts-expect-error
    execResult.payload = Buffer.from(hexData.replace(/\s/g, ''), 'hex');
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
  group: Lexer.SKIPPED,
});

export const Comment = createToken({
  name: "Comment",
  pattern: /\/\/.*/,
  group: Lexer.SKIPPED,
});

export const MultipleLineComment = createToken({
  name: "MultipleLineComment",
  pattern: /\/\*[^*]*\*+([^/*][^*]*\*+)*\//,
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
