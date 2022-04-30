import { NEXT_STEP_MAPPING } from "./NextStepMapping";
import { QUOTE_MAP, QUOTE_REGEXP, UNQUOTE_MAP } from "./QuoteMaps";

export function addQuotes(string: string): string {
  return String(string).replace(QUOTE_REGEXP, (sub) => {
    return QUOTE_MAP[sub];
  });
}

const OCTAL_DIGITS = "01234567".split("");

const ESCAPE_PREFIXES = [
  ...OCTAL_DIGITS,
  "a",
  "b",
  "f",
  "n",
  "r",
  "t",
  "v",

  `\"`,
  "\n",

  "U",

  "\\",
];

// Credit to Samantha Marshall
// Taken from https://github.com/samdmarshall/pbPlist/blob/346c29f91f913d35d0e24f6722ec19edb24e5707/pbPlist/StrParse.py#L197
// Licensed under https://raw.githubusercontent.com/samdmarshall/pbPlist/blob/346c29f91f913d35d0e24f6722ec19edb24e5707/LICENSE
//
// Originally from: http://www.opensource.apple.com/source/CF/CF-744.19/CFOldStylePList.c See `getSlashedChar()`
export function stripQuotes(input: string): string {
  let formattedString = "";
  let extractedString = input;
  let stringLength = input.length;
  let index = 0;

  while (index < stringLength) {
    let currentChar = extractedString[index];
    if (currentChar === `\\`) {
      let nextChar = extractedString[index + 1];
      if (ESCAPE_PREFIXES.includes(nextChar)) {
        index++;
        if (UNQUOTE_MAP[nextChar]) {
          formattedString += UNQUOTE_MAP[nextChar];
        } else if (nextChar === "U") {
          const startingIndex = index + 1;
          const endingIndex = startingIndex + 4;
          const unicodeNumbers = extractedString.slice(
            startingIndex,
            endingIndex
          );
          for (const number in unicodeNumbers.split("")) {
            index += 1;
            if (!isHexNumber(number)) {
              // let message = 'Invalid unicode sequence on line '+str(LineNumberForIndex(string_data, start_index+index))
              throw new Error(
                `Unicode '\\U' escape sequence terminated without 4 following hex characters`
              );
            }
            formattedString += String.fromCharCode(
              parseInt(unicodeNumbers, 16)
            );
          }
        } else if (OCTAL_DIGITS.includes(nextChar)) {
          const octalString = extractedString.slice(index - 1, 3);
          if (/\\A[0-7]{3}\\z/.test(octalString)) {
            let startingIndex = index;
            let endingIndex = startingIndex + 1;

            for (let octIndex = 0; octIndex < 3; octIndex++) {
              let test_index = startingIndex + octIndex;
              let test_oct = extractedString[test_index];
              if (OCTAL_DIGITS.includes(test_oct)) {
                endingIndex += 1;
              }
            }

            let octalNumbers = extractedString.slice(
              startingIndex,
              endingIndex
            );
            let hexNumber = parseInt(octalNumbers, 8);
            if (hexNumber >= 0x80) {
              // @ts-ignore
              hexNumber = NEXT_STEP_MAPPING[hexNumber];
            }
            formattedString += String.fromCharCode(hexNumber);
          } else {
            formattedString += nextChar;
          }
        } else {
          throw new Error(
            `Failed to handle ${nextChar} which is in the list of possible escapes`
          );
        }
      } else {
        formattedString += currentChar;
        index++;
        formattedString += nextChar;
      }
    } else {
      formattedString += currentChar;
    }
    index++;
  }

  return formattedString;
}

function isHexNumber(number: string): boolean {
  return /^[0-9a-fA-F]$/.test(number);
}
