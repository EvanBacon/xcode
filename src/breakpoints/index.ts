/**
 * Low-level API for parsing and building Xcode breakpoint list files (Breakpoints_v2.xcbkptlist).
 *
 * @example
 * ```ts
 * import * as breakpoints from "@bacons/xcode/breakpoints";
 *
 * // Parse a breakpoint list file
 * const list = breakpoints.parse(xml);
 *
 * // Add a new breakpoint
 * list.breakpoints?.push({
 *   breakpointExtensionID: "Xcode.Breakpoint.FileBreakpoint",
 *   breakpointContent: {
 *     shouldBeEnabled: true,
 *     filePath: "path/to/file.swift",
 *     startingLineNumber: "42",
 *     endingLineNumber: "42",
 *   },
 * });
 *
 * // Serialize back to XML
 * const xml = breakpoints.build(list);
 * ```
 */

export { parse } from "./parser";
export { build } from "./writer";
export * from "./types";
