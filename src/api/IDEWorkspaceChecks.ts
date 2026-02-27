/**
 * High-level API for IDEWorkspaceChecks.plist files.
 *
 * Introduced in Xcode 9.3, these files store the state of workspace checks
 * to prevent them from being recomputed each time the workspace is opened.
 *
 * Currently known keys:
 * - IDEDidComputeMac32BitWarning: Tracks whether the 32-bit macOS deprecation
 *   warning has been computed/shown. Setting to true suppresses the warning.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";

import { parseChecks, buildChecks } from "../workspace/checks";
import type { IDEWorkspaceChecks as ChecksData } from "../workspace/types";

/** Relative path from workspace to the checks plist */
const CHECKS_PATH = "xcshareddata/IDEWorkspaceChecks.plist";

/**
 * High-level class for working with IDEWorkspaceChecks.plist files.
 */
export class IDEWorkspaceChecks {
  /** The parsed checks data */
  props: ChecksData;

  /** Path to the plist file (may be undefined for new instances) */
  filePath?: string;

  private constructor(props: ChecksData, filePath?: string) {
    this.props = props;
    this.filePath = filePath;
  }

  /**
   * Open an existing IDEWorkspaceChecks.plist from a workspace.
   *
   * @param workspacePath Path to the .xcworkspace directory
   * @returns The checks instance, or null if the file doesn't exist
   */
  static open(workspacePath: string): IDEWorkspaceChecks | null {
    const checksPath = path.join(workspacePath, CHECKS_PATH);
    if (!existsSync(checksPath)) {
      return null;
    }

    const plistString = readFileSync(checksPath, "utf-8");
    const props = parseChecks(plistString);
    return new IDEWorkspaceChecks(props, checksPath);
  }

  /**
   * Open an existing IDEWorkspaceChecks.plist or create a new one.
   *
   * @param workspacePath Path to the .xcworkspace directory
   * @returns The checks instance (opened or newly created)
   */
  static openOrCreate(workspacePath: string): IDEWorkspaceChecks {
    const existing = IDEWorkspaceChecks.open(workspacePath);
    if (existing) {
      return existing;
    }

    const checksPath = path.join(workspacePath, CHECKS_PATH);
    return new IDEWorkspaceChecks(
      { IDEDidComputeMac32BitWarning: true },
      checksPath
    );
  }

  /**
   * Create a new IDEWorkspaceChecks instance.
   *
   * @param options Optional initial props and file path
   */
  static create(options?: {
    props?: Partial<ChecksData>;
    filePath?: string;
  }): IDEWorkspaceChecks {
    const defaultProps: ChecksData = {
      IDEDidComputeMac32BitWarning: true,
    };

    const props = { ...defaultProps, ...options?.props };
    return new IDEWorkspaceChecks(props, options?.filePath);
  }

  /**
   * Save the checks to disk.
   *
   * @param filePath Optional path to save to. If not provided, uses this.filePath.
   */
  save(filePath?: string): void {
    const targetPath = filePath ?? this.filePath;
    if (!targetPath) {
      throw new Error(
        "No file path specified. Either provide a path or set this.filePath."
      );
    }

    // Ensure parent directory exists
    const dir = path.dirname(targetPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    const plistString = buildChecks(this.props);
    writeFileSync(targetPath, plistString, "utf-8");
    this.filePath = targetPath;
  }

  /**
   * Save the checks to a workspace directory.
   *
   * @param workspacePath Path to the .xcworkspace directory
   */
  saveToWorkspace(workspacePath: string): void {
    const checksPath = path.join(workspacePath, CHECKS_PATH);
    this.save(checksPath);
  }

  /**
   * Get the plist representation of the checks.
   */
  toPlist(): string {
    return buildChecks(this.props);
  }

  /**
   * Get whether the Mac 32-bit warning has been computed/dismissed.
   */
  get mac32BitWarningComputed(): boolean {
    return this.props.IDEDidComputeMac32BitWarning ?? false;
  }

  /**
   * Set whether the Mac 32-bit warning has been computed/dismissed.
   */
  set mac32BitWarningComputed(value: boolean) {
    this.props.IDEDidComputeMac32BitWarning = value;
  }

  /**
   * Get a check value by key.
   *
   * @param key The check key
   * @returns The boolean value, or undefined if not set
   */
  getCheck(key: string): boolean | undefined {
    return this.props[key];
  }

  /**
   * Set a check value.
   *
   * @param key The check key
   * @param value The boolean value
   */
  setCheck(key: string, value: boolean): void {
    this.props[key] = value;
  }

  /**
   * Remove a check.
   *
   * @param key The check key
   * @returns true if the check was removed, false if it didn't exist
   */
  removeCheck(key: string): boolean {
    if (key in this.props) {
      delete this.props[key];
      return true;
    }
    return false;
  }
}
