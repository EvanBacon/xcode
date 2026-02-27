/**
 * TypeScript definitions for Xcode build configuration files (.xcconfig)
 *
 * XCConfig files are simple text files that define build settings for Xcode
 * projects and targets. They support includes, conditional settings, and
 * variable expansion.
 */

/**
 * Condition for conditional build settings.
 * Settings can be conditioned on SDK, architecture, or configuration.
 *
 * Example: `OTHER_LDFLAGS[sdk=iphoneos*][arch=arm64] = -framework UIKit`
 */
export interface XCConfigCondition {
  /** SDK condition, e.g., "iphoneos*", "macosx*" */
  sdk?: string;
  /** Architecture condition, e.g., "arm64", "x86_64" */
  arch?: string;
  /** Configuration condition, e.g., "Debug", "Release" */
  config?: string;
}

/**
 * A single build setting with optional conditions.
 */
export interface XCConfigSetting {
  /** Setting key, e.g., "OTHER_LDFLAGS" */
  key: string;
  /** Setting value, e.g., "-framework UIKit" */
  value: string;
  /** Optional conditions for this setting */
  conditions?: XCConfigCondition[];
}

/**
 * An include directive.
 *
 * Supports both required and optional includes:
 * - `#include "path.xcconfig"` - Required include
 * - `#include? "path.xcconfig"` - Optional include (no error if missing)
 */
export interface XCConfigInclude {
  /** Path to the included xcconfig file */
  path: string;
  /** Whether this is an optional include (#include? vs #include) */
  optional: boolean;
}

/**
 * A resolved include with parsed content.
 */
export interface XCConfigIncludeResolved {
  /** The original include directive */
  include: XCConfigInclude;
  /** Absolute resolved path to the file */
  resolvedPath: string;
  /** Parsed config if successfully loaded, undefined if optional and missing */
  config?: XCConfig;
}

/**
 * Parsed xcconfig file.
 */
export interface XCConfig {
  /** Include directives with resolved content */
  includes: XCConfigIncludeResolved[];
  /** Build settings defined in this file */
  buildSettings: XCConfigSetting[];
}

/**
 * Options for parsing xcconfig files.
 */
export interface XCConfigParseOptions {
  /** Base directory for resolving relative include paths */
  basePath?: string;
  /** Whether to recursively parse included files (default: true) */
  resolveIncludes?: boolean;
  /** Set of already-visited paths for cycle detection */
  visitedPaths?: Set<string>;
}

/**
 * Options for flattening build settings.
 */
export interface XCConfigFlattenOptions {
  /** SDK to filter conditions, e.g., "iphoneos" */
  sdk?: string;
  /** Architecture to filter conditions, e.g., "arm64" */
  arch?: string;
  /** Configuration to filter conditions, e.g., "Debug" */
  config?: string;
  /** Resolver function for variable expansion */
  resolver?: (key: string) => string | undefined;
}
