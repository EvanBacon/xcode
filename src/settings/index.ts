/**
 * Low-level API for parsing and building Xcode workspace settings files (WorkspaceSettings.xcsettings).
 *
 * @example
 * ```ts
 * import * as settings from "@bacons/xcode/settings";
 *
 * // Parse a workspace settings file
 * const config = settings.parse(plistString);
 *
 * // Modify settings
 * config.PreviewsEnabled = true;
 * config.IDEWorkspaceSharedSettings_AutocreateContextsIfNeeded = false;
 *
 * // Serialize back to plist
 * const output = settings.build(config);
 * ```
 */

export { parse } from "./parser";
export { build } from "./writer";
export * from "./types";
