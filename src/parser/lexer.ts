import { Lexer, TokenType } from './chevrotain';
import identifiers from './identifiers';

// the vocabulary will be exported and used in the Parser definition.
export const tokenVocabulary: Record<string, TokenType> = {};

// The order of tokens is important
export const tokens = [...identifiers];

export const lexer = new Lexer(tokens);

tokens.forEach((tokenType) => {
  tokenVocabulary[tokenType.name] = tokenType;
});
