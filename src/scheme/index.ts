/**
 * Low-level API for parsing and building Xcode scheme files (.xcscheme).
 *
 * @example
 * ```ts
 * import * as scheme from "@bacons/xcode/scheme";
 *
 * // Parse an xcscheme file
 * const xcscheme = scheme.parse(xml);
 *
 * // Modify the scheme
 * xcscheme.buildAction.parallelizeBuildables = true;
 *
 * // Serialize back to XML
 * const xml = scheme.build(xcscheme);
 * ```
 */

export { parse } from "./parser";
export { build } from "./writer";
export { parseManagement, buildManagement } from "./management";
export * from "./types";
