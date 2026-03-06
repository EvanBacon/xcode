/**
 * High-level API for Xcode user data directories (xcuserdata).
 *
 * Provides unified access to per-user schemes, breakpoints, and scheme management
 * stored in xcuserdata directories of .xcodeproj or .xcworkspace bundles.
 *
 * Unlike shared data (xcshareddata), user data is per-developer and typically
 * not checked into version control.
 */
import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
} from "fs";
import path from "path";

import * as breakpoints from "../breakpoints";
import * as scheme from "../scheme";
import type { XCBreakpointList } from "../breakpoints/types";
import type { XCSchemeManagement } from "../scheme/types";
import { XCScheme } from "./XCScheme";

/**
 * High-level class for working with Xcode user data directories.
 *
 * User data includes:
 * - Schemes (xcschemes/*.xcscheme)
 * - Scheme management (xcschemes/xcschememanagement.plist)
 * - Breakpoints (xcdebugger/Breakpoints_v2.xcbkptlist)
 *
 * User data is stored in: xcuserdata/{username}.xcuserdatad/
 */
export class XCUserData {
  /** Path to the xcuserdatad directory (may be undefined for new instances) */
  filePath?: string;

  /** The username this data belongs to */
  userName: string;

  /** Cached breakpoints data */
  private _breakpoints?: XCBreakpointList;
  private _breakpointsLoaded = false;

  /** Cached scheme management data */
  private _schemeManagement?: XCSchemeManagement;
  private _schemeManagementLoaded = false;

  private constructor(userName: string, filePath?: string) {
    this.userName = userName;
    this.filePath = filePath;
  }

  /**
   * Open an existing user data directory.
   *
   * @param userDataPath Path to the .xcuserdatad directory
   */
  static open(userDataPath: string): XCUserData {
    if (!existsSync(userDataPath)) {
      throw new Error(`User data directory does not exist: ${userDataPath}`);
    }

    // Extract username from directory name (e.g., "username.xcuserdatad" -> "username")
    const dirName = path.basename(userDataPath);
    if (!dirName.endsWith(".xcuserdatad")) {
      throw new Error(
        `Invalid user data directory name: ${dirName}. Expected *.xcuserdatad`
      );
    }
    const userName = dirName.replace(/\.xcuserdatad$/, "");

    return new XCUserData(userName, userDataPath);
  }

  /**
   * Create a new XCUserData instance for a user.
   *
   * @param userName The username this data belongs to
   */
  static create(userName: string): XCUserData {
    return new XCUserData(userName);
  }

  /**
   * Discover all user data directories in an xcuserdata folder.
   *
   * @param xcuserdataPath Path to the xcuserdata directory (e.g., Project.xcodeproj/xcuserdata)
   * @returns Array of XCUserData instances for each user
   */
  static discoverUsers(xcuserdataPath: string): XCUserData[] {
    if (!existsSync(xcuserdataPath)) {
      return [];
    }

    const entries = readdirSync(xcuserdataPath);
    return entries
      .filter((entry) => entry.endsWith(".xcuserdatad"))
      .map((entry) => XCUserData.open(path.join(xcuserdataPath, entry)));
  }

  /**
   * Get the directory name for this user's data.
   */
  getDirName(): string {
    return `${this.userName}.xcuserdatad`;
  }

  // ============================================================================
  // Schemes
  // ============================================================================

  /**
   * Get the path to the xcschemes directory.
   */
  getSchemesDir(): string | undefined {
    if (!this.filePath) return undefined;
    return path.join(this.filePath, "xcschemes");
  }

  /**
   * Get all user schemes.
   */
  getSchemes(): XCScheme[] {
    const schemesDir = this.getSchemesDir();
    if (!schemesDir || !existsSync(schemesDir)) {
      return [];
    }

    const files = readdirSync(schemesDir);
    return files
      .filter((f) => f.endsWith(".xcscheme"))
      .map((f) => XCScheme.open(path.join(schemesDir, f)));
  }

  /**
   * Get a scheme by name.
   */
  getScheme(name: string): XCScheme | null {
    const schemesDir = this.getSchemesDir();
    if (!schemesDir) return null;

    const schemePath = path.join(schemesDir, `${name}.xcscheme`);
    if (!existsSync(schemePath)) return null;

    return XCScheme.open(schemePath);
  }

  /**
   * Save a scheme to the schemes directory.
   */
  saveScheme(xcscheme: XCScheme): void {
    if (!this.filePath) {
      throw new Error("Cannot save scheme: no file path set for XCUserData");
    }

    const schemesDir = path.join(this.filePath, "xcschemes");
    if (!existsSync(schemesDir)) {
      mkdirSync(schemesDir, { recursive: true });
    }

    const schemePath = path.join(schemesDir, `${xcscheme.name}.xcscheme`);
    xcscheme.save(schemePath);
  }

  /**
   * Get or load scheme management data.
   */
  get schemeManagement(): XCSchemeManagement | undefined {
    if (this._schemeManagementLoaded) {
      return this._schemeManagement;
    }

    this._schemeManagementLoaded = true;

    if (!this.filePath) return undefined;

    const managementPath = path.join(
      this.filePath,
      "xcschemes",
      "xcschememanagement.plist"
    );

    if (!existsSync(managementPath)) {
      return undefined;
    }

    const plistContent = readFileSync(managementPath, "utf-8");
    this._schemeManagement = scheme.parseManagement(plistContent);
    return this._schemeManagement;
  }

  /**
   * Set scheme management data.
   */
  set schemeManagement(value: XCSchemeManagement | undefined) {
    this._schemeManagement = value;
    this._schemeManagementLoaded = true;
  }

  /**
   * Save scheme management to disk.
   */
  saveSchemeManagement(): void {
    if (!this.filePath) {
      throw new Error(
        "Cannot save scheme management: no file path set for XCUserData"
      );
    }

    const schemesDir = path.join(this.filePath, "xcschemes");
    if (!existsSync(schemesDir)) {
      mkdirSync(schemesDir, { recursive: true });
    }

    const managementPath = path.join(schemesDir, "xcschememanagement.plist");

    if (this._schemeManagement) {
      const plistContent = scheme.buildManagement(this._schemeManagement);
      writeFileSync(managementPath, plistContent, "utf-8");
    }
  }

  // ============================================================================
  // Breakpoints
  // ============================================================================

  /**
   * Get the path to the breakpoints file.
   */
  getBreakpointsPath(): string | undefined {
    if (!this.filePath) return undefined;
    return path.join(this.filePath, "xcdebugger", "Breakpoints_v2.xcbkptlist");
  }

  /**
   * Get or load breakpoints data.
   */
  get breakpoints(): XCBreakpointList | undefined {
    if (this._breakpointsLoaded) {
      return this._breakpoints;
    }

    this._breakpointsLoaded = true;

    const breakpointsPath = this.getBreakpointsPath();
    if (!breakpointsPath || !existsSync(breakpointsPath)) {
      return undefined;
    }

    const xml = readFileSync(breakpointsPath, "utf-8");
    this._breakpoints = breakpoints.parse(xml);
    return this._breakpoints;
  }

  /**
   * Set breakpoints data.
   */
  set breakpoints(value: XCBreakpointList | undefined) {
    this._breakpoints = value;
    this._breakpointsLoaded = true;
  }

  /**
   * Save breakpoints to disk.
   */
  saveBreakpoints(): void {
    if (!this.filePath) {
      throw new Error(
        "Cannot save breakpoints: no file path set for XCUserData"
      );
    }

    const debuggerDir = path.join(this.filePath, "xcdebugger");
    if (!existsSync(debuggerDir)) {
      mkdirSync(debuggerDir, { recursive: true });
    }

    const breakpointsPath = path.join(debuggerDir, "Breakpoints_v2.xcbkptlist");

    if (this._breakpoints) {
      const xml = breakpoints.build(this._breakpoints);
      writeFileSync(breakpointsPath, xml, "utf-8");
    }
  }

  // ============================================================================
  // Save All
  // ============================================================================

  /**
   * Save all modified data to disk.
   *
   * @param dirPath Optional path to save to. If not provided, uses this.filePath.
   */
  save(dirPath?: string): void {
    const targetPath = dirPath ?? this.filePath;
    if (!targetPath) {
      throw new Error(
        "No file path specified. Either provide a path or set this.filePath."
      );
    }

    this.filePath = targetPath;

    if (!existsSync(targetPath)) {
      mkdirSync(targetPath, { recursive: true });
    }

    if (this._breakpointsLoaded && this._breakpoints) {
      this.saveBreakpoints();
    }

    if (this._schemeManagementLoaded && this._schemeManagement) {
      this.saveSchemeManagement();
    }
  }
}
