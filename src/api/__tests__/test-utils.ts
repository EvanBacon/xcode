import path from "path";
import { XcodeProject } from "..";
import { build, parse } from "../../json";
import { AbstractObject } from "../AbstractObject";

/**
 * Base fixtures directory
 */
const FIXTURES_DIR = path.join(__dirname, "../../json/__tests__/fixtures/");

/**
 * Get the absolute path to a fixture file.
 */
export function fixturePath(name: string): string {
  return path.join(FIXTURES_DIR, name);
}

/**
 * Load a fixture file and return an XcodeProject instance.
 */
export function loadFixture(name: string): XcodeProject {
  return XcodeProject.open(fixturePath(name));
}

/**
 * Assert that a project round-trips correctly:
 * parse -> toJSON -> build -> parse -> toJSON should equal original toJSON
 */
export function expectRoundTrip(project: XcodeProject): void {
  const json1 = project.toJSON();
  const built = build(json1);
  const parsed = parse(built);
  const project2 = new XcodeProject(project.filePath, parsed);
  const json2 = project2.toJSON();

  // Deep equality check
  expect(json2).toEqual(json1);
}

/**
 * Assert that no orphan references exist in the project.
 * An orphan reference is when an object references a UUID that doesn't exist.
 */
export function expectNoOrphanReferences(project: XcodeProject): void {
  const allUuids = new Set(project.keys());

  for (const [uuid, obj] of project.entries()) {
    const json = obj.toJSON();

    // Check all string values that look like UUIDs (24 hex chars)
    checkForOrphanUuids(json, allUuids, uuid, obj.isa);
  }
}

/**
 * Recursively check an object for orphan UUID references.
 */
function checkForOrphanUuids(
  value: unknown,
  validUuids: Set<string>,
  parentUuid: string,
  parentIsa: string
): void {
  if (typeof value === "string") {
    // Check if it looks like a UUID (24 hex chars, common in pbxproj)
    if (/^[A-F0-9]{24}$/.test(value)) {
      if (!validUuids.has(value)) {
        throw new Error(
          `Orphan reference found: ${parentIsa} (${parentUuid}) references non-existent UUID ${value}`
        );
      }
    }
  } else if (Array.isArray(value)) {
    for (const item of value) {
      checkForOrphanUuids(item, validUuids, parentUuid, parentIsa);
    }
  } else if (value && typeof value === "object") {
    for (const key of Object.keys(value)) {
      // Skip known non-UUID string fields
      if (
        key === "isa" ||
        key === "name" ||
        key === "path" ||
        key === "shellScript" ||
        key === "repositoryURL"
      ) {
        continue;
      }
      checkForOrphanUuids(
        (value as Record<string, unknown>)[key],
        validUuids,
        parentUuid,
        parentIsa
      );
    }
  }
}

/**
 * Get all objects of a specific type from a project.
 */
export function getObjectsOfType<T extends AbstractObject>(
  project: XcodeProject,
  isa: string
): T[] {
  const results: T[] = [];
  for (const obj of project.values()) {
    if (obj.isa === isa) {
      results.push(obj as unknown as T);
    }
  }
  return results;
}

/**
 * Silence console.warn during test execution and restore after.
 */
export function withSilentWarnings<T>(fn: () => T): T {
  const originalWarn = console.warn;
  console.warn = jest.fn();
  try {
    return fn();
  } finally {
    console.warn = originalWarn;
  }
}

/**
 * Create a mock console.warn and return captured warnings.
 */
export function captureWarnings(): {
  warnings: string[];
  restore: () => void;
} {
  const originalWarn = console.warn;
  const warnings: string[] = [];
  console.warn = (...args: unknown[]) => {
    warnings.push(args.map(String).join(" "));
  };
  return {
    warnings,
    restore: () => {
      console.warn = originalWarn;
    },
  };
}
