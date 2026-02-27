/**
 * Parser for Xcode build configuration files (.xcconfig)
 *
 * Uses regex-based parsing for the simple line-oriented format.
 */
import * as fs from "node:fs";
import * as path from "node:path";

import type {
  XCConfig,
  XCConfigInclude,
  XCConfigIncludeResolved,
  XCConfigSetting,
  XCConfigCondition,
  XCConfigParseOptions,
} from "./types";

// Regex patterns for xcconfig parsing
const INCLUDE_REGEX = /^#include(\?)?\s*"(.+)"$/;
const SETTING_REGEX = /^([a-zA-Z_][a-zA-Z0-9_]*(?:\[[^\]]+\])*)\s*=\s*(.*)$/;
const CONDITION_REGEX = /\[([a-zA-Z]+)=([^\]]+)\]/g;
const COMMENT_REGEX = /\/\/.*/;

/**
 * Parse xcconfig content from a string.
 *
 * @param content - The xcconfig file content
 * @returns Parsed XCConfig object (without resolved includes)
 */
export function parse(content: string): XCConfig {
  const includes: XCConfigIncludeResolved[] = [];
  const buildSettings: XCConfigSetting[] = [];

  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    // Strip comments (// to end of line)
    const line = rawLine.replace(COMMENT_REGEX, "").trim();

    // Skip empty lines
    if (!line) continue;

    // Check for include directive
    const includeMatch = line.match(INCLUDE_REGEX);
    if (includeMatch) {
      const optional = includeMatch[1] === "?";
      const includePath = includeMatch[2];
      includes.push({
        include: { path: includePath, optional },
        resolvedPath: includePath, // Will be resolved properly in parseFile
        config: undefined,
      });
      continue;
    }

    // Check for setting
    const settingMatch = line.match(SETTING_REGEX);
    if (settingMatch) {
      const keyWithConditions = settingMatch[1];
      const value = settingMatch[2].trim();

      // Extract conditions from key
      const conditions = parseConditions(keyWithConditions);
      const key = keyWithConditions.replace(CONDITION_REGEX, "");

      buildSettings.push({
        key,
        value,
        conditions: conditions.length > 0 ? conditions : undefined,
      });
    }
  }

  return { includes, buildSettings };
}

/**
 * Parse conditions from a key like "OTHER_LDFLAGS[sdk=iphoneos*][arch=arm64]"
 */
function parseConditions(keyWithConditions: string): XCConfigCondition[] {
  const conditions: XCConfigCondition[] = [];
  let match: RegExpExecArray | null;
  const regex = new RegExp(CONDITION_REGEX);

  while ((match = regex.exec(keyWithConditions)) !== null) {
    const conditionType = match[1].toLowerCase();
    const conditionValue = match[2];

    const condition: XCConfigCondition = {};
    if (conditionType === "sdk") {
      condition.sdk = conditionValue;
    } else if (conditionType === "arch") {
      condition.arch = conditionValue;
    } else if (conditionType === "config") {
      condition.config = conditionValue;
    }

    if (Object.keys(condition).length > 0) {
      conditions.push(condition);
    }
  }

  return conditions;
}

/**
 * Parse an xcconfig file and resolve includes.
 *
 * @param filePath - Path to the xcconfig file
 * @param options - Parse options
 * @returns Parsed XCConfig with resolved includes
 */
export function parseFile(
  filePath: string,
  options: XCConfigParseOptions = {}
): XCConfig {
  const {
    basePath = path.dirname(filePath),
    resolveIncludes = true,
    visitedPaths = new Set<string>(),
  } = options;

  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(basePath, filePath);

  // Cycle detection
  if (visitedPaths.has(absolutePath)) {
    throw new Error(`Circular include detected: ${absolutePath}`);
  }

  const content = fs.readFileSync(absolutePath, "utf-8");
  const config = parse(content);

  if (!resolveIncludes) {
    return config;
  }

  // Track this path for cycle detection
  const newVisitedPaths = new Set(visitedPaths);
  newVisitedPaths.add(absolutePath);

  // Resolve includes
  const resolvedIncludes: XCConfigIncludeResolved[] = [];
  const fileDir = path.dirname(absolutePath);

  for (const includeEntry of config.includes) {
    const includePath = includeEntry.include.path;
    const resolvedPath = path.resolve(fileDir, includePath);

    try {
      if (!fs.existsSync(resolvedPath)) {
        if (includeEntry.include.optional) {
          resolvedIncludes.push({
            include: includeEntry.include,
            resolvedPath,
            config: undefined,
          });
          continue;
        }
        throw new Error(`Include file not found: ${resolvedPath}`);
      }

      const includedConfig = parseFile(resolvedPath, {
        basePath: path.dirname(resolvedPath),
        resolveIncludes: true,
        visitedPaths: newVisitedPaths,
      });

      resolvedIncludes.push({
        include: includeEntry.include,
        resolvedPath,
        config: includedConfig,
      });
    } catch (error) {
      if (includeEntry.include.optional) {
        resolvedIncludes.push({
          include: includeEntry.include,
          resolvedPath,
          config: undefined,
        });
      } else {
        throw error;
      }
    }
  }

  return {
    includes: resolvedIncludes,
    buildSettings: config.buildSettings,
  };
}
