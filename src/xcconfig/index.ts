/**
 * Low-level API for parsing and building Xcode build configuration files (.xcconfig).
 *
 * @example
 * ```ts
 * import * as xcconfig from "@bacons/xcode/xcconfig";
 *
 * // Parse xcconfig content
 * const config = xcconfig.parse(`
 *   #include "Base.xcconfig"
 *   PRODUCT_NAME = MyApp
 *   OTHER_LDFLAGS[sdk=iphoneos*] = -framework UIKit
 * `);
 *
 * // Parse file with resolved includes
 * const config = xcconfig.parseFile("./Project.xcconfig");
 *
 * // Flatten build settings (merge includes, apply conditions)
 * const settings = xcconfig.flattenBuildSettings(config, {
 *   sdk: "iphoneos",
 *   arch: "arm64",
 * });
 *
 * // Serialize back to xcconfig format
 * const content = xcconfig.build(config);
 * ```
 */

export { parse, parseFile } from "./parser";
export { build } from "./writer";
export * from "./types";

import type {
  XCConfig,
  XCConfigSetting,
  XCConfigCondition,
  XCConfigFlattenOptions,
} from "./types";

/**
 * Flatten build settings from an xcconfig, merging includes and applying conditions.
 *
 * Settings are applied in order:
 * 1. Included files (recursively, in order)
 * 2. Settings in the current file
 *
 * Later settings override earlier ones. Settings with conditions are only
 * included if they match the provided sdk/arch/config options.
 *
 * @param config - Parsed XCConfig
 * @param options - Options for filtering and variable resolution
 * @returns Flattened build settings as a key-value map
 */
export function flattenBuildSettings(
  config: XCConfig,
  options: XCConfigFlattenOptions = {}
): Record<string, string> {
  const settings: Record<string, string> = {};

  // Process includes first (they are overridden by local settings)
  for (const include of config.includes) {
    if (include.config) {
      const includedSettings = flattenBuildSettings(include.config, options);
      Object.assign(settings, includedSettings);
    }
  }

  // Process local settings
  for (const setting of config.buildSettings) {
    if (matchesConditions(setting.conditions, options)) {
      const value = resolveInherited(setting.value, setting.key, settings);
      settings[setting.key] = value;
    }
  }

  return settings;
}

/**
 * Check if a setting's conditions match the provided options.
 *
 * A conditional setting is only included if:
 * 1. The options specify the relevant filter (sdk, arch, config)
 * 2. The filter value matches the condition's pattern
 *
 * Settings without conditions always match.
 */
function matchesConditions(
  conditions: XCConfigCondition[] | undefined,
  options: XCConfigFlattenOptions
): boolean {
  if (!conditions || conditions.length === 0) {
    return true;
  }

  // All conditions must be satisfied
  return conditions.every((condition) => {
    // If condition specifies sdk, options must also specify sdk and it must match
    if (condition.sdk) {
      if (!options.sdk) return false;
      if (!matchWildcard(options.sdk, condition.sdk)) return false;
    }
    // If condition specifies arch, options must also specify arch and it must match
    if (condition.arch) {
      if (!options.arch) return false;
      if (!matchWildcard(options.arch, condition.arch)) return false;
    }
    // If condition specifies config, options must also specify config and it must match
    if (condition.config) {
      if (!options.config) return false;
      if (!matchWildcard(options.config, condition.config)) return false;
    }
    return true;
  });
}

/**
 * Match a value against a wildcard pattern.
 * Supports * as wildcard for any characters.
 */
function matchWildcard(value: string, pattern: string): boolean {
  // Convert wildcard pattern to regex
  const regexPattern = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&") // Escape regex special chars except *
    .replace(/\*/g, ".*"); // Convert * to .*

  const regex = new RegExp(`^${regexPattern}$`, "i");
  return regex.test(value);
}

/**
 * Resolve $(inherited) in a value by prepending the existing value.
 */
function resolveInherited(
  value: string,
  key: string,
  existingSettings: Record<string, string>
): string {
  const inheritedPattern = /\$\(inherited\)/gi;

  if (!inheritedPattern.test(value)) {
    return value;
  }

  const existingValue = existingSettings[key] ?? "";
  return value.replace(inheritedPattern, existingValue);
}
