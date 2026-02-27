/**
 * High-level API for Xcode workspace files (contents.xcworkspacedata).
 *
 * Provides convenient methods for creating and manipulating workspaces.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";

import * as workspace from "../workspace";
import type { XCWorkspace as WorkspaceData, FileRef, Group } from "../workspace/types";

/**
 * High-level class for working with Xcode workspace files.
 */
export class XCWorkspace {
  /** The workspace name (derived from directory name) */
  name: string;

  /** The parsed workspace data */
  props: WorkspaceData;

  /** Path to the .xcworkspace directory (may be undefined for new workspaces) */
  filePath?: string;

  private constructor(name: string, props: WorkspaceData, filePath?: string) {
    this.name = name;
    this.props = props;
    this.filePath = filePath;
  }

  /**
   * Load a workspace from a .xcworkspace directory.
   *
   * @param workspacePath Path to the .xcworkspace directory
   */
  static open(workspacePath: string): XCWorkspace {
    const contentsPath = path.join(workspacePath, "contents.xcworkspacedata");
    if (!existsSync(contentsPath)) {
      throw new Error(
        `Invalid workspace: ${contentsPath} does not exist`
      );
    }

    const xml = readFileSync(contentsPath, "utf-8");
    const props = workspace.parse(xml);
    const name = path.basename(workspacePath, ".xcworkspace");
    return new XCWorkspace(name, props, workspacePath);
  }

  /**
   * Create a new empty workspace.
   *
   * @param name The workspace name
   * @param props Optional initial workspace data
   */
  static create(name: string, props?: Partial<WorkspaceData>): XCWorkspace {
    const defaultProps: WorkspaceData = {
      version: "1.0",
      fileRefs: [],
    };

    // Merge provided props with defaults
    const mergedProps = { ...defaultProps, ...props };

    return new XCWorkspace(name, mergedProps);
  }

  /**
   * Save the workspace to disk.
   *
   * @param workspacePath Optional path to save to. If not provided, uses this.filePath.
   */
  save(workspacePath?: string): void {
    const targetPath = workspacePath ?? this.filePath;
    if (!targetPath) {
      throw new Error(
        "No file path specified. Either provide a path or set this.filePath."
      );
    }

    // Ensure .xcworkspace directory exists
    if (!existsSync(targetPath)) {
      mkdirSync(targetPath, { recursive: true });
    }

    const contentsPath = path.join(targetPath, "contents.xcworkspacedata");
    const xml = workspace.build(this.props);
    writeFileSync(contentsPath, xml, "utf-8");
    this.filePath = targetPath;
  }

  /**
   * Get the XML representation of the workspace.
   */
  toXML(): string {
    return workspace.build(this.props);
  }

  /**
   * Add a project reference to the workspace.
   *
   * @param projectPath Path to the .xcodeproj relative to the workspace
   * @param locationType Location type prefix (default: "group")
   */
  addProject(projectPath: string, locationType: "group" | "container" | "absolute" = "group"): void {
    if (!this.props.fileRefs) {
      this.props.fileRefs = [];
    }

    const location = `${locationType}:${projectPath}`;

    // Check if already added
    const existing = this.props.fileRefs.find((ref) => ref.location === location);
    if (existing) {
      return;
    }

    this.props.fileRefs.push({ location });
  }

  /**
   * Remove a project reference from the workspace.
   *
   * @param projectPath Path to the .xcodeproj (with or without location prefix)
   * @returns true if the project was removed, false if not found
   */
  removeProject(projectPath: string): boolean {
    if (!this.props.fileRefs) {
      return false;
    }

    const initialLength = this.props.fileRefs.length;

    // Match either the exact location or just the path portion
    this.props.fileRefs = this.props.fileRefs.filter((ref) => {
      const refPath = ref.location.includes(":")
        ? ref.location.split(":").slice(1).join(":")
        : ref.location;
      return refPath !== projectPath && ref.location !== projectPath;
    });

    return this.props.fileRefs.length < initialLength;
  }

  /**
   * Get all project paths in the workspace.
   *
   * @returns Array of project locations
   */
  getProjectPaths(): string[] {
    const paths: string[] = [];

    // Collect from top-level fileRefs
    if (this.props.fileRefs) {
      paths.push(...this.props.fileRefs.map((ref) => ref.location));
    }

    // Recursively collect from groups
    if (this.props.groups) {
      for (const group of this.props.groups) {
        paths.push(...this.collectPathsFromGroup(group));
      }
    }

    return paths;
  }

  /**
   * Add a group to the workspace.
   *
   * @param name The group name
   * @param location Optional location for the group
   * @returns The created group
   */
  addGroup(name: string, location?: string): Group {
    if (!this.props.groups) {
      this.props.groups = [];
    }

    // Check if already exists
    const existing = this.props.groups.find(
      (g) => g.name === name && g.location === location
    );
    if (existing) {
      return existing;
    }

    const group: Group = {
      name,
      location,
      fileRefs: [],
    };

    this.props.groups.push(group);
    return group;
  }

  /**
   * Get a group by name.
   *
   * @param name The group name
   * @returns The group or undefined if not found
   */
  getGroup(name: string): Group | undefined {
    return this.props.groups?.find((g) => g.name === name);
  }

  /**
   * Remove a group from the workspace.
   *
   * @param name The group name
   * @returns true if the group was removed, false if not found
   */
  removeGroup(name: string): boolean {
    if (!this.props.groups) {
      return false;
    }

    const initialLength = this.props.groups.length;
    this.props.groups = this.props.groups.filter((g) => g.name !== name);
    return this.props.groups.length < initialLength;
  }

  /**
   * Check if the workspace contains a project.
   *
   * @param projectPath Path to check (with or without location prefix)
   * @returns true if the project is in the workspace
   */
  hasProject(projectPath: string): boolean {
    const paths = this.getProjectPaths();
    return paths.some((p) => {
      const pathPortion = p.includes(":") ? p.split(":").slice(1).join(":") : p;
      return pathPortion === projectPath || p === projectPath;
    });
  }

  private collectPathsFromGroup(group: Group): string[] {
    const paths: string[] = [];

    if (group.fileRefs) {
      paths.push(...group.fileRefs.map((ref) => ref.location));
    }

    if (group.groups) {
      for (const nestedGroup of group.groups) {
        paths.push(...this.collectPathsFromGroup(nestedGroup));
      }
    }

    return paths;
  }
}
