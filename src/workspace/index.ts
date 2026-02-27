/**
 * Low-level API for parsing and building Xcode workspace files (contents.xcworkspacedata).
 *
 * @example
 * ```ts
 * import * as workspace from "@bacons/xcode/workspace";
 *
 * // Parse an xcworkspacedata file
 * const ws = workspace.parse(xml);
 *
 * // Modify the workspace
 * ws.fileRefs?.push({ location: "group:NewProject.xcodeproj" });
 *
 * // Serialize back to XML
 * const xml = workspace.build(ws);
 * ```
 */

export { parse } from "./parser";
export { build } from "./writer";
export { parseChecks, buildChecks } from "./checks";
export * from "./types";
