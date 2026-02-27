import { parse } from "./parser";
import { XcodeProject } from "./types";
import { Writer } from "./writer";

export { parse } from "./parser";

/** @returns a string representation of the given `pbxproj` in Apple's [Old-Style Plist](http://www.opensource.apple.com/source/CF/CF-744.19/CFOldStylePList.c) `string` format. */
export function build(project: Partial<XcodeProject>): string {
  return new Writer(project).getResults();
}

export * from "./types";
