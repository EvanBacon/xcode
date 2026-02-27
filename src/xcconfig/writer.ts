/**
 * Writer for Xcode build configuration files (.xcconfig)
 *
 * Serializes XCConfig objects back to xcconfig format.
 */
import type { XCConfig, XCConfigSetting, XCConfigCondition } from "./types";

/**
 * Build an xcconfig string from a typed XCConfig object.
 *
 * @param config - The XCConfig object to serialize
 * @returns xcconfig file content as a string
 */
export function build(config: XCConfig): string {
  const lines: string[] = [];

  // Write includes first
  for (const include of config.includes) {
    const optional = include.include.optional ? "?" : "";
    lines.push(`#include${optional} "${include.include.path}"`);
  }

  // Add blank line between includes and settings if both exist
  if (config.includes.length > 0 && config.buildSettings.length > 0) {
    lines.push("");
  }

  // Write settings
  for (const setting of config.buildSettings) {
    lines.push(buildSetting(setting));
  }

  return lines.join("\n") + (lines.length > 0 ? "\n" : "");
}

/**
 * Build a single setting line.
 */
function buildSetting(setting: XCConfigSetting): string {
  let key = setting.key;

  // Append conditions
  if (setting.conditions) {
    for (const condition of setting.conditions) {
      key += buildCondition(condition);
    }
  }

  return `${key} = ${setting.value}`;
}

/**
 * Build a condition string like "[sdk=iphoneos*]"
 */
function buildCondition(condition: XCConfigCondition): string {
  const parts: string[] = [];

  if (condition.sdk) {
    parts.push(`[sdk=${condition.sdk}]`);
  }
  if (condition.arch) {
    parts.push(`[arch=${condition.arch}]`);
  }
  if (condition.config) {
    parts.push(`[config=${condition.config}]`);
  }

  return parts.join("");
}
