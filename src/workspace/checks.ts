/**
 * Parser and writer for IDEWorkspaceChecks.plist files.
 *
 * Introduced in Xcode 9.3, these files store the state of workspace checks
 * to prevent them from being recomputed each time the workspace is opened.
 * The primary use is suppressing the macOS 32-bit deprecation warning.
 */
import plist from "@expo/plist";

import type { IDEWorkspaceChecks } from "./types";

/**
 * Parse an IDEWorkspaceChecks.plist string into a typed object.
 */
export function parseChecks(plistString: string): IDEWorkspaceChecks {
  const parsed = plist.parse(plistString) as Record<string, unknown>;

  const result: IDEWorkspaceChecks = {};

  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value === "boolean") {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Build an IDEWorkspaceChecks.plist string from a typed object.
 */
export function buildChecks(checks: IDEWorkspaceChecks): string {
  const obj: Record<string, boolean> = {};

  for (const [key, value] of Object.entries(checks)) {
    if (typeof value === "boolean") {
      obj[key] = value;
    }
  }

  return plist.build(obj);
}
