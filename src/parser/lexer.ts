import { Lexer } from "./chevrotain";
import identifiers from "./identifiers";

// The order of tokens is important
export const tokens = [...identifiers];

export const lexer = new Lexer(tokens);
