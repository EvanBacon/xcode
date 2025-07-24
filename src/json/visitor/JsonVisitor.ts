import { BaseVisitor } from "../parser/parser";
import { XcodeProject } from "../types";

/** Converts a CST for `pbxproj` into a JSON representation. */
export class JsonVisitor extends BaseVisitor {
  context: Partial<XcodeProject> = {};

  constructor() {
    super();
    // The "validateVisitor" method is a helper utility which performs static analysis
    // to detect missing or redundant visitor methods
    this.validateVisitor();
  }

  head(ctx: any) {
    if (ctx.array) {
      this.context = this.visit(ctx.array);
    } else if (ctx.object) {
      this.context = this.visit(ctx.object);
    }
  }

  object(ctx: any) {
    return (
      ctx.objectItem?.reduce(
        (prev: any, item: any) => ({
          ...prev,
          ...this.visit(item),
        }),
        {}
      ) ?? {}
    );
  }

  array(ctx: any) {
    return ctx.value?.map((item: any) => this.visit(item)) ?? [];
  }

  objectItem(ctx: any) {
    return {
      [this.visit(ctx.identifier)]: this.visit(ctx.value),
    };
  }

  identifier(ctx: any) {
    if (ctx.QuotedString) {
      return ctx.QuotedString[0].payload ?? ctx.QuotedString[0].image;
    } else if (ctx.StringLiteral) {
      const literal = ctx.StringLiteral[0].payload ?? ctx.StringLiteral[0].image;
      return parseType(literal);
    }
    throw new Error("unhandled identifier: " + JSON.stringify(ctx));
  }

  value(ctx: any) {
    if (ctx.identifier) {
      return this.visit(ctx.identifier);
    } else if (ctx.DataLiteral) {
      return ctx.DataLiteral[0].payload ?? ctx.DataLiteral[0].image;
    } else if (ctx.object) {
      return this.visit(ctx.object);
    } else if (ctx.array) {
      return this.visit(ctx.array);
    }
    throw new Error("unhandled value: " + JSON.stringify(ctx));
  }
}

function parseType(literal: string): number | string {
  // Preserve octal literals with leading zeros
  if (/^0\d+$/.test(literal)) {
    return literal;
  }
  
  // Handle decimal numbers but preserve trailing zeros
  if (/^[+-]?([0-9]+\.?[0-9]*|\.[0-9]+)$/.test(literal)) {
    if (/0$/.test(literal)) {
      return literal; // Preserve trailing zero
    }
    const num = parseFloat(literal);
    if (!isNaN(num)) return num;
  }
  
  // Handle integers
  if (/^\d+$/.test(literal)) {
    const num = parseInt(literal, 10);
    if (!isNaN(num)) return num;
  }
  
  return literal;
}
