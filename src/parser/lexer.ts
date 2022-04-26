import * as chevrotain from "chevrotain";

import identifiers from "./identifiers";

const Lexer = chevrotain.Lexer;

// the vocabulary will be exported and used in the Parser definition.
export const tokenVocabulary: { [key: string]: chevrotain.TokenType } = {};

// The order of tokens is important
export const tokens = [...identifiers];

export const lexer = new Lexer(tokens);

tokens.forEach((tokenType) => {
  tokenVocabulary[tokenType.name] = tokenType;
});
