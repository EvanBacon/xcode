import * as parser from "./parser/parser";
import { XcodeProject } from "./types";
import { JsonVisitor } from "./visitor/JsonVisitor";
import { Writer } from "./writer";

/** @returns a JSON representation of the given `pbxproj` file in string format. */
export function parse(text: string): Partial<XcodeProject> {
  const cst = parser.parse(text);
  const visitor = new JsonVisitor();
  visitor.visit(cst);
  return visitor.context;
}

/** @returns a string representation of the given `pbxproj` in Apple's [Old-Style Plist](http://www.opensource.apple.com/source/CF/CF-744.19/CFOldStylePList.c) `string` format. */
export function build(project: Partial<XcodeProject>): string {
  return new Writer(project).getResults();
}

export * from "./types";
export { parseOptimized, parseWithStrategy, benchmarkParsing, analyzeProjectMetadata } from "./OptimizedParser";
