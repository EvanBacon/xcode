import { createSyntaxDiagramsCode, CstNode, CstParser, tokenMatcher } from './chevrotain';
import {
  ArrayEnd,
  ArrayStart,
  Colon,
  Comment,
  DataLiteral,
  ObjectEnd,
  ObjectStart,
  QuotedString,
  Separator,
  StringLiteral,
  Terminator,
} from './identifiers';
import { lexer, tokens } from './lexer';

export class CommentCstParser extends CstParser {
  LA(howMuch: any) {
    // Skip Comments during regular parsing as we wish to auto-magically insert them
    // into our CST
    while (tokenMatcher(super.LA(howMuch), Comment)) {
      // @ts-expect-error
      super.consumeToken();
    }

    return super.LA(howMuch);
  }

  cstPostTerminal(key: string, consumedToken: any) {
    // @ts-expect-error
    super.cstPostTerminal(key, consumedToken);

    let lookBehindIdx = -1;
    let prevToken = super.LA(lookBehindIdx);

    // After every Token (terminal) is successfully consumed
    // We will add all the comment that appeared before it to the CST (Parse Tree)
    while (tokenMatcher(prevToken, Comment)) {
      // @ts-expect-error
      super.cstPostTerminal(Comment.name, prevToken);
      lookBehindIdx--;
      prevToken = super.LA(lookBehindIdx);
    }
  }
}

export class PbxprojParser extends CommentCstParser {
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
export const serializedGrammar = parser.getSerializedGastProductions();
export const htmlText = createSyntaxDiagramsCode(serializedGrammar);

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
