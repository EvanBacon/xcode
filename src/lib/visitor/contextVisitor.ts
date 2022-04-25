import { BaseVisitor } from "../parser/parser";
import { XcodeProject } from "../types";

/** Converts a CST for `pbxproj` into a JSON representation. */
export class ContextVisitor extends BaseVisitor {
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
    console.log("id:", ctx);
    if (ctx.QuotedString) {
      return ctx.QuotedString[0].payload ?? ctx.QuotedString[0].image;
    } else if (ctx.StringLiteral) {
      return ctx.StringLiteral[0].payload ?? ctx.StringLiteral[0].image;
    }
    throw new Error("unhandled: " + ctx);
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
    throw new Error("unhandled: " + ctx);
  }
}
