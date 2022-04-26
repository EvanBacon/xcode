import { addQuotes, stripQuotes } from "../index";

const cases = {
  // Unquoted: [Quoted]
  [`hello\n`]: ["hello\\n"],
  abc: ["abc"],
  "\n": ["\\n"],
  "\xF0\x9F\x98\x82": ["\xF0\x9F\x98\x82"],
  //   [`\a\b\f\r\n\t\v\n'\"`]: [`\\a\\b\\f\\r\\n\\t\\v\\n'\\\"`],

  "\u00FD": [
    "\u00FD",
    // broken
    // "\\367",
  ],

  "\u{1f30c}": ["\u{1f30c}"],
  "\u1111": [
    "\u1111",
    //   "\\U1111"
  ],

  //   "\u001e": [
  //     "\\U001e",
  //       "\\U001E"
  //   ],

  "12": ["12", `\\12`],
  "129": ["129", "\\129"],
  "1h9": ["1h9", "\\1h9"],
  "a\nb": ["a\\nb", "a\\\nb"],
  //   "\u0000": [
  //     "\u0000",
  //     //   "\\U0000",
  //   ],
  "5": [
    "5",
    //   "\\U0035"
  ],
  //   "\u0007": [
  //       "\\a",
  //       "\\U0007"
  //     ],
  "\\\\\\\\": ["\\\\\\\\\\\\\\\\"],

  //   'xz': ['xz', `\x\z`]
};

describe(stripQuotes, () => {
  Object.entries(cases).forEach(([unquoted, all_quoted]) => {
    describe(`to ${JSON.stringify(unquoted)}`, () => {
      all_quoted.forEach((quoted) => {
        it(`unquotes ${JSON.stringify(quoted)} to ${JSON.stringify(
          unquoted
        )}`, () => {
          //   expect(JSON.stringify(unquotify_string(quoted))).toEqual(
          //     JSON.stringify(unquoted)
          //   );
          expect(stripQuotes(quoted)).toEqual(unquoted);
        });
      });
    });
  });
});

describe(addQuotes, () => {
  Object.entries(cases).forEach(([unquoted, all_quoted]) => {
    const quoted = all_quoted[0];
    it(`quotes ${JSON.stringify(unquoted)} to ${JSON.stringify(
      quoted
    )}`, () => {
      const res = addQuotes(unquoted);
      expect(res).toEqual(quoted);
    });
  });
});
