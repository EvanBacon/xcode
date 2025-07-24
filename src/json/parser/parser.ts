import {
  CstNode,
  CstParser,
} from "./chevrotain";
import {
  ArrayEnd,
  ArrayStart,
  Colon,
  DataLiteral,
  ObjectEnd,
  ObjectStart,
  QuotedString,
  Separator,
  StringLiteral,
  Terminator,
} from "./identifiers";
import { lexer, tokens } from "./lexer";

export class PbxprojParser extends CstParser {
  constructor() {
    super(tokens, {
      recoveryEnabled: false,
    });

    // very important to call this after all the rules have been setup.
    // otherwise the parser may not work correctly as it will lack information
    // derived from the self analysis.
    this.performSelfAnalysis();
  }

  head = this.RULE("head", () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.array) },
      { ALT: () => this.SUBRULE(this.object) },
    ]);
  });

  array = this.RULE("array", () => {
    this.CONSUME(ArrayStart);
    this.OPTION(() => {
      this.MANY(() => {
        this.SUBRULE(this.value);
        this.OPTION2(() => this.CONSUME(Separator));
      });
    });
    this.CONSUME(ArrayEnd);
  });

  object = this.RULE("object", () => {
    this.CONSUME(ObjectStart);
    this.OPTION(() => {
      this.MANY(() => {
        this.SUBRULE(this.objectItem);
      });
    });
    this.CONSUME(ObjectEnd);
  });

  objectItem = this.RULE("objectItem", () => {
    this.SUBRULE(this.identifier);
    this.CONSUME(Colon);
    this.SUBRULE(this.value);
    this.CONSUME(Terminator);
  });

  identifier = this.RULE("identifier", () => {
    this.OR([
      { ALT: () => this.CONSUME(QuotedString) },
      { ALT: () => this.CONSUME(StringLiteral) },
    ]);
  });

  value = this.RULE("value", () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.object) },
      { ALT: () => this.SUBRULE(this.array) },
      { ALT: () => this.CONSUME(DataLiteral) },
      { ALT: () => this.SUBRULE(this.identifier) },
    ]);
  });
}

const parser = new PbxprojParser();
export const BaseVisitor = parser.getBaseCstVisitorConstructorWithDefaults();

export function parse(text: string): CstNode {
  const lexingResult = lexer.tokenize(text);
  if (lexingResult.errors.length) {
    throw new Error(`Parsing errors: ${lexingResult.errors[0].message}`);
  }

  parser.input = lexingResult.tokens;
  const parsingResult = parser.head();

  if (parser.errors.length) {
    throw new Error(`Parsing errors: ${parser.errors[0].message}`);
  }

  return parsingResult;
}
