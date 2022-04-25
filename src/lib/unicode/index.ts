import { QUOTE_MAP, QUOTE_REGEXP, UNQUOTE_MAP } from "./QuoteMaps";
// @ts-ignore
import replaceAll from "string.prototype.replaceall";
import { NEXT_STEP_MAPPING } from "./NextStepMapping";
// @ts-expect-error
import bufferpack from "bufferpack";

class UnsupportedEscapeSequenceError extends Error {}
class InvalidEscapeSequenceError extends Error {}

//   module_function

export function quotify_string(string: string): string {
  return replaceAll(string, QUOTE_REGEXP, QUOTE_MAP);
}

export const ESCAPE_PREFIXES = [
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "a",
  "b",
  "f",
  "n",
  "r",
  "t",
  "v",
  "\n",
  "U",
  "\\",
];

export const OCTAL_DIGITS = [0, 1, 2, 3, 4, 5, 6, 7].map((v) => String(v));

// Credit to Samantha Marshall
// Taken from https://github.com/samdmarshall/pbPlist/blob/346c29f91f913d35d0e24f6722ec19edb24e5707/pbPlist/StrParse.py#L197
// Licensed under https://raw.githubusercontent.com/samdmarshall/pbPlist/blob/346c29f91f913d35d0e24f6722ec19edb24e5707/LICENSE
//
// Originally from: http://www.opensource.apple.com/source/CF/CF-744.19/CFOldStylePList.c See `getSlashedChar()`
export function unquotify_string(string: string): string {
  let formattedString = "";
  let extractedString = string;
  let stringLength = string.length;
  let index = 0;

  let loopProtect = 0;

  while (index < stringLength) {
    // For code sandbox <3
    loopProtect++;
    if (loopProtect > 1000) {
      break;
    }

    let escapeIndex = extractedString.indexOf("\\", index);
    if (escapeIndex > -1) {
      if (index !== escapeIndex) {
        formattedString += extractedString.substring(index, escapeIndex - 1); // [index...escape_index]
        // formatted_string += extracted_string[index...escape_index]
      }
      index = escapeIndex + 1;
      const nextChar = extractedString[index];
      if (ESCAPE_PREFIXES.indexOf(nextChar) > -1) {
        index += 1;
        let length = 0;
        // @ts-expect-error
        if (UNQUOTE_MAP[nextChar]) {
          // @ts-expect-error
          formattedString += UNQUOTE_MAP[nextChar];
        } else if (nextChar === "U") {
          length = 4;
          const unicodeNumbers = extractedString.substring(index, length);
          if (!/\\A\\h{4}\\z/.test(unicodeNumbers)) {
            throw new InvalidEscapeSequenceError(
              `Unicode '\\U' escape sequence terminated without 4 following hex characters`
            );
          }

          index += length;
          formattedString += bufferpack.pack("U", [
            parseInt(unicodeNumbers, 16),
          ]);
          //   formatted_string << [unicode_numbers.to_i(16)].pack('U')
        } else if (OCTAL_DIGITS.indexOf(nextChar) > -1) {
          // https://twitter.com/Catfish_Man/status/658014170055507968

          const octalString = extractedString.substring(index - 1, 3); //[index - 1, 3]
          // const octal_string = extracted_string[index - 1, 3]
          if (/\\A[0-7]{3}\\z/.test(octalString)) {
            index += 2;
            const codePoint = parseInt(octalString, 8); // octal_string.to_i(8)
            // @ts-expect-error
            const converted = NEXT_STEP_MAPPING[codePoint];
            if (!(codePoint <= 0x80 || converted)) {
              throw new InvalidEscapeSequenceError(
                `Invalid octal escape sequence ${octalString}`
              );
            }
            formattedString += bufferpack.pack("U", [converted]);
            // [converted].pack('U')
          } else {
            formattedString += nextChar;
          }
        } else {
          throw new UnsupportedEscapeSequenceError(
            `Failed to handle ${nextChar} which is in the list of possible escapes`
          );
        }
      } else {
        index += 1;
        formattedString += nextChar;
      }
    } else {
      formattedString += extractedString.slice(index); // [index..-1]
      index = stringLength;
    }
  }

  return formattedString;
}

const XML_STRING_ESCAPES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
};

const XML_STRING_ESCAPE_REGEXP = new RegExp(
  Object.keys(XML_STRING_ESCAPES).join("|"),
  "g"
);
//  Regexp.union(Object.keys(XML_STRING_ESCAPES))

export function xmlEscapeString(string: string): string {
  return replaceAll(
    String(string),
    XML_STRING_ESCAPE_REGEXP,
    XML_STRING_ESCAPES
  );
  //  return  string.to_s.gsub(XML_STRING_ESCAPE_REGEXP, XML_STRING_ESCAPES)
}
