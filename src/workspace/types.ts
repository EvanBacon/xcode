/**
 * TypeScript definitions for Xcode workspace files (contents.xcworkspacedata)
 *
 * XCWorkspace files are XML documents that define a collection of Xcode projects
 * and other file references that are grouped together for development.
 */

/** Root workspace object */
export interface XCWorkspace {
  /** Workspace version, e.g., "1.0" */
  version?: string;
  /** File references in the workspace */
  fileRefs?: FileRef[];
  /** Group references in the workspace (nested structure) */
  groups?: Group[];
}

/**
 * Reference to a file or project in the workspace.
 *
 * Location specifiers:
 * - `group:path` - Relative path from workspace root (most common)
 * - `self:` - Self-reference (embedded workspace inside .xcodeproj)
 * - `container:path` - Absolute container reference (rare)
 * - `absolute:path` - Absolute path
 */
export interface FileRef {
  /** Location specifier with path, e.g., "group:App.xcodeproj" */
  location: string;
}

/**
 * Group of file references.
 * Groups allow organizing workspace contents into folders.
 */
export interface Group {
  /** Location specifier for the group */
  location?: string;
  /** Name of the group */
  name?: string;
  /** File references within this group */
  fileRefs?: FileRef[];
  /** Nested groups */
  groups?: Group[];
}
