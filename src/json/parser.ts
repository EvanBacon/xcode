/**
 * High-performance pbxproj parser - single pass, no CST overhead
 * Optimized for speed while maintaining spec compliance
 */

import type { XcodeProject } from "./types";

// NextStep Unicode mappings for Xcode compatibility
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

// Character codes for fast comparison
const CHAR_SPACE = 32;
const CHAR_TAB = 9;
const CHAR_NEWLINE = 10;
const CHAR_CARRIAGE = 13;
const CHAR_OPEN_BRACE = 123;   // {
const CHAR_CLOSE_BRACE = 125;  // }
const CHAR_OPEN_PAREN = 40;    // (
const CHAR_CLOSE_PAREN = 41;   // )
const CHAR_SEMICOLON = 59;     // ;
const CHAR_COMMA = 44;         // ,
const CHAR_EQUALS = 61;        // =
const CHAR_DOUBLE_QUOTE = 34;  // "
const CHAR_SINGLE_QUOTE = 39;  // '
const CHAR_BACKSLASH = 92;     // \
const CHAR_SLASH = 47;         // /
const CHAR_ASTERISK = 42;      // *
const CHAR_LESS_THAN = 60;     // <
const CHAR_GREATER_THAN = 62;  // >

// Escape character map using char codes
const ESCAPE_CODES: Record<number, number> = {
  97: 7,    // a -> \a (bell)
  98: 8,    // b -> \b (backspace)
  102: 12,  // f -> \f (form feed)
  110: 10,  // n -> \n (newline)
  114: 13,  // r -> \r (carriage return)
  116: 9,   // t -> \t (tab)
  118: 11,  // v -> \v (vertical tab)
  34: 34,   // " -> "
  39: 39,   // ' -> '
  92: 92,   // \ -> \
  10: 10,   // newline -> newline
};

// Pre-computed lookup tables
const IS_WHITESPACE = new Uint8Array(256);
IS_WHITESPACE[CHAR_SPACE] = 1;
IS_WHITESPACE[CHAR_TAB] = 1;
IS_WHITESPACE[CHAR_NEWLINE] = 1;
IS_WHITESPACE[CHAR_CARRIAGE] = 1;

const IS_STRING_CHAR = new Uint8Array(256);
// a-z, A-Z, 0-9, _, $, /, :, ., -
for (let i = 65; i <= 90; i++) IS_STRING_CHAR[i] = 1;  // A-Z
for (let i = 97; i <= 122; i++) IS_STRING_CHAR[i] = 1; // a-z
for (let i = 48; i <= 57; i++) IS_STRING_CHAR[i] = 1;  // 0-9
IS_STRING_CHAR[95] = 1;  // _
IS_STRING_CHAR[36] = 1;  // $
IS_STRING_CHAR[47] = 1;  // /
IS_STRING_CHAR[58] = 1;  // :
IS_STRING_CHAR[46] = 1;  // .
IS_STRING_CHAR[45] = 1;  // -

const IS_HEX = new Uint8Array(256);
for (let i = 48; i <= 57; i++) IS_HEX[i] = 1;   // 0-9
for (let i = 65; i <= 70; i++) IS_HEX[i] = 1;   // A-F
for (let i = 97; i <= 102; i++) IS_HEX[i] = 1;  // a-f

const IS_OCTAL = new Uint8Array(256);
for (let i = 48; i <= 55; i++) IS_OCTAL[i] = 1; // 0-7

const IS_DIGIT = new Uint8Array(256);
for (let i = 48; i <= 57; i++) IS_DIGIT[i] = 1; // 0-9

export class Parser {
  private text: string;
  private pos: number = 0;
  private len: number;

  constructor(text: string) {
    this.text = text;
    this.len = text.length;
  }

  parse(): Partial<XcodeProject> {
    this.skipWhitespaceAndComments();
    const code = this.text.charCodeAt(this.pos);
    if (code === CHAR_OPEN_BRACE) {
      return this.parseObject();
    } else if (code === CHAR_OPEN_PAREN) {
      return this.parseArray() as any;
    }
    throw this.error("Expected '{' or '('");
  }

  private skipWhitespaceAndComments(): void {
    while (this.pos < this.len) {
      const code = this.text.charCodeAt(this.pos);

      if (IS_WHITESPACE[code]) {
        this.pos++;
        continue;
      }

      if (code === CHAR_SLASH) {
        const next = this.text.charCodeAt(this.pos + 1);
        if (next === CHAR_SLASH) {
          // Single line comment
          this.pos += 2;
          while (this.pos < this.len && this.text.charCodeAt(this.pos) !== CHAR_NEWLINE) {
            this.pos++;
          }
          continue;
        } else if (next === CHAR_ASTERISK) {
          // Multi-line comment
          this.pos += 2;
          while (this.pos < this.len - 1) {
            if (this.text.charCodeAt(this.pos) === CHAR_ASTERISK &&
                this.text.charCodeAt(this.pos + 1) === CHAR_SLASH) {
              this.pos += 2;
              break;
            }
            this.pos++;
          }
          continue;
        }
      }

      break;
    }
  }

  private parseObject(): Record<string, any> {
    this.pos++; // skip '{'
    const obj: Record<string, any> = {};

    while (true) {
      this.skipWhitespaceAndComments();

      if (this.pos >= this.len) {
        throw this.error("Unexpected end of input in object");
      }

      const code = this.text.charCodeAt(this.pos);
      if (code === CHAR_CLOSE_BRACE) {
        this.pos++;
        return obj;
      }

      // Parse key
      const key = this.parseIdentifierAsString();

      this.skipWhitespaceAndComments();

      // Expect '='
      if (this.text.charCodeAt(this.pos) !== CHAR_EQUALS) {
        throw this.error("Expected '='");
      }
      this.pos++;

      this.skipWhitespaceAndComments();

      // Parse value
      obj[key] = this.parseValue();

      this.skipWhitespaceAndComments();

      // Expect ';'
      if (this.text.charCodeAt(this.pos) !== CHAR_SEMICOLON) {
        throw this.error("Expected ';'");
      }
      this.pos++;
    }
  }

  private parseArray(): any[] {
    this.pos++; // skip '('
    const arr: any[] = [];

    while (true) {
      this.skipWhitespaceAndComments();

      if (this.pos >= this.len) {
        throw this.error("Unexpected end of input in array");
      }

      const code = this.text.charCodeAt(this.pos);
      if (code === CHAR_CLOSE_PAREN) {
        this.pos++;
        return arr;
      }

      arr.push(this.parseValue());

      this.skipWhitespaceAndComments();

      // Optional comma
      if (this.text.charCodeAt(this.pos) === CHAR_COMMA) {
        this.pos++;
      }
    }
  }

  private parseValue(): any {
    this.skipWhitespaceAndComments();

    const code = this.text.charCodeAt(this.pos);

    if (code === CHAR_OPEN_BRACE) {
      return this.parseObject();
    }

    if (code === CHAR_OPEN_PAREN) {
      return this.parseArray();
    }

    if (code === CHAR_LESS_THAN) {
      return this.parseDataLiteral();
    }

    if (code === CHAR_DOUBLE_QUOTE || code === CHAR_SINGLE_QUOTE) {
      return this.parseQuotedString();
    }

    return this.parseStringLiteral();
  }

  private parseIdentifierAsString(): string {
    const code = this.text.charCodeAt(this.pos);

    if (code === CHAR_DOUBLE_QUOTE || code === CHAR_SINGLE_QUOTE) {
      return this.parseQuotedString();
    }

    return this.parseStringLiteralRaw();
  }

  private parseStringLiteralRaw(): string {
    const start = this.pos;

    while (this.pos < this.len && IS_STRING_CHAR[this.text.charCodeAt(this.pos)]) {
      this.pos++;
    }

    if (this.pos === start) {
      throw this.error("Expected string literal");
    }

    return this.text.slice(start, this.pos);
  }

  private parseStringLiteral(): string | number {
    const literal = this.parseStringLiteralRaw();
    return this.parseType(literal);
  }

  private parseType(literal: string): string | number {
    const len = literal.length;
    if (len === 0) return literal;

    const first = literal.charCodeAt(0);

    // Check if all digits
    let allDigits = IS_DIGIT[first] === 1;
    if (allDigits) {
      for (let i = 1; i < len; i++) {
        if (IS_DIGIT[literal.charCodeAt(i)] !== 1) {
          allDigits = false;
          break;
        }
      }
    }

    if (allDigits) {
      // Preserve octal literals with leading zeros
      if (first === 48 && len > 1) { // starts with '0'
        return literal;
      }

      // Parse as integer if safe
      const num = parseInt(literal, 10);
      if (Number.isSafeInteger(num)) {
        return num;
      }
      return literal;
    }

    // Check for decimal number
    let hasDot = false;
    let isNumber = true;
    let hasTrailingZero = false;

    for (let i = 0; i < len; i++) {
      const c = literal.charCodeAt(i);
      if (c === 46) { // .
        if (hasDot) {
          isNumber = false;
          break;
        }
        hasDot = true;
      } else if (c === 43 || c === 45) { // + or -
        if (i !== 0) {
          isNumber = false;
          break;
        }
      } else if (IS_DIGIT[c] !== 1) {
        isNumber = false;
        break;
      }
    }

    if (isNumber && hasDot) {
      // Check for trailing zero
      if (literal.charCodeAt(len - 1) === 48) { // ends with '0'
        return literal;
      }
      const num = parseFloat(literal);
      if (!isNaN(num)) return num;
    }

    return literal;
  }

  private parseQuotedString(): string {
    const quote = this.text.charCodeAt(this.pos);
    this.pos++; // skip opening quote

    // Fast path: no escapes
    const start = this.pos;
    let hasEscape = false;

    while (this.pos < this.len) {
      const code = this.text.charCodeAt(this.pos);
      if (code === quote) {
        if (!hasEscape) {
          const result = this.text.slice(start, this.pos);
          this.pos++; // skip closing quote
          return result;
        }
        break;
      }
      if (code === CHAR_BACKSLASH) {
        hasEscape = true;
        this.pos += 2; // skip escape sequence
      } else {
        this.pos++;
      }
    }

    if (this.pos >= this.len) {
      throw this.error("Unterminated string");
    }

    // Slow path: has escapes
    const raw = this.text.slice(start, this.pos);
    this.pos++; // skip closing quote
    return this.unescapeString(raw);
  }

  private unescapeString(input: string): string {
    const result: string[] = [];
    let i = 0;
    const len = input.length;

    while (i < len) {
      const code = input.charCodeAt(i);

      if (code === CHAR_BACKSLASH && i + 1 < len) {
        const nextCode = input.charCodeAt(i + 1);

        const escaped = ESCAPE_CODES[nextCode];
        if (escaped !== undefined) {
          result.push(String.fromCharCode(escaped));
          i += 2;
          continue;
        }

        // Unicode escape \UXXXX
        if (nextCode === 85 && i + 5 < len) { // 'U'
          const hex = input.slice(i + 2, i + 6);
          if (this.isHexString(hex)) {
            result.push(String.fromCharCode(parseInt(hex, 16)));
            i += 6;
            continue;
          }
        }

        // Octal escape
        if (IS_OCTAL[nextCode]) {
          let octal = '';
          let j = i + 1;
          while (j < len && j < i + 4 && IS_OCTAL[input.charCodeAt(j)]) {
            octal += input[j];
            j++;
          }
          const code = parseInt(octal, 8);
          const mapped = code >= 0x80 ? (NEXT_STEP_MAPPINGS[code] || code) : code;
          result.push(String.fromCharCode(mapped));
          i = j;
          continue;
        }

        // Unknown escape, keep both characters
        result.push(input[i], input[i + 1]);
        i += 2;
      } else {
        result.push(input[i]);
        i++;
      }
    }

    return result.join('');
  }

  private isHexString(s: string): boolean {
    if (s.length !== 4) return false;
    for (let i = 0; i < 4; i++) {
      if (!IS_HEX[s.charCodeAt(i)]) return false;
    }
    return true;
  }

  private parseDataLiteral(): Buffer {
    this.pos++; // skip '<'

    const hexChars: string[] = [];

    while (this.pos < this.len) {
      const code = this.text.charCodeAt(this.pos);

      if (code === CHAR_GREATER_THAN) {
        this.pos++;
        return Buffer.from(hexChars.join(''), 'hex');
      }

      if (IS_WHITESPACE[code]) {
        this.pos++;
        continue;
      }

      if (IS_HEX[code]) {
        hexChars.push(this.text[this.pos]);
        this.pos++;
        continue;
      }

      throw this.error("Invalid character in data literal");
    }

    throw this.error("Unterminated data literal");
  }

  private error(message: string): Error {
    // Find line and column for error message
    let line = 1;
    let col = 1;
    for (let i = 0; i < this.pos; i++) {
      if (this.text.charCodeAt(i) === CHAR_NEWLINE) {
        line++;
        col = 1;
      } else {
        col++;
      }
    }
    return new Error(`${message} at line ${line}, column ${col}`);
  }
}

export function parse(text: string): Partial<XcodeProject> {
  return new Parser(text).parse();
}
