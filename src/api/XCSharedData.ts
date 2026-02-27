/**
 * High-level API for Xcode shared data directories (xcshareddata).
 *
 * Provides unified access to schemes, breakpoints, and workspace settings
 * stored in xcshareddata directories of .xcodeproj or .xcworkspace bundles.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "fs";
import path from "path";

import * as breakpoints from "../breakpoints";
import * as settings from "../settings";
import * as scheme from "../scheme";
import type { XCBreakpointList } from "../breakpoints/types";
import type { WorkspaceSettings } from "../settings/types";
import type { XCSchemeManagement } from "../scheme/types";
import { XCScheme } from "./XCScheme";

/**
 * High-level class for working with Xcode shared data directories.
 *
 * Shared data includes:
 * - Schemes (xcschemes/*.xcscheme)
 * - Scheme management (xcschemes/xcschememanagement.plist)
 * - Breakpoints (xcdebugger/Breakpoints_v2.xcbkptlist)
 * - Workspace settings (WorkspaceSettings.xcsettings)
 */
export class XCSharedData {
  /** Path to the xcshareddata directory (may be undefined for new instances) */
  filePath?: string;

  /** Cached breakpoints data */
  private _breakpoints?: XCBreakpointList;
  private _breakpointsLoaded = false;

  /** Cached workspace settings data */
  private _workspaceSettings?: WorkspaceSettings;
  private _workspaceSettingsLoaded = false;

  /** Cached scheme management data */
  private _schemeManagement?: XCSchemeManagement;
  private _schemeManagementLoaded = false;

  private constructor(filePath?: string) {
    this.filePath = filePath;
  }

  /**
   * Open an xcshareddata directory.
   *
   * @param sharedDataPath Path to the xcshareddata directory
   */
  static open(sharedDataPath: string): XCSharedData {
    if (!existsSync(sharedDataPath)) {
      throw new Error(`Shared data directory does not exist: ${sharedDataPath}`);
    }
    return new XCSharedData(sharedDataPath);
  }

  /**
   * Create a new XCSharedData instance.
   */
  static create(): XCSharedData {
    return new XCSharedData();
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
   * Get all shared schemes.
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
      throw new Error("Cannot save scheme: no file path set for XCSharedData");
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
        "Cannot save scheme management: no file path set for XCSharedData"
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
        "Cannot save breakpoints: no file path set for XCSharedData"
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
  // Workspace Settings
  // ============================================================================

  /**
   * Get the path to the workspace settings file.
   */
  getWorkspaceSettingsPath(): string | undefined {
    if (!this.filePath) return undefined;
    return path.join(this.filePath, "WorkspaceSettings.xcsettings");
  }

  /**
   * Get or load workspace settings.
   */
  get workspaceSettings(): WorkspaceSettings | undefined {
    if (this._workspaceSettingsLoaded) {
      return this._workspaceSettings;
    }

    this._workspaceSettingsLoaded = true;

    const settingsPath = this.getWorkspaceSettingsPath();
    if (!settingsPath || !existsSync(settingsPath)) {
      return undefined;
    }

    const plistContent = readFileSync(settingsPath, "utf-8");
    this._workspaceSettings = settings.parse(plistContent);
    return this._workspaceSettings;
  }

  /**
   * Set workspace settings.
   */
  set workspaceSettings(value: WorkspaceSettings | undefined) {
    this._workspaceSettings = value;
    this._workspaceSettingsLoaded = true;
  }

  /**
   * Save workspace settings to disk.
   */
  saveWorkspaceSettings(): void {
    if (!this.filePath) {
      throw new Error(
        "Cannot save workspace settings: no file path set for XCSharedData"
      );
    }

    if (!existsSync(this.filePath)) {
      mkdirSync(this.filePath, { recursive: true });
    }

    const settingsPath = path.join(this.filePath, "WorkspaceSettings.xcsettings");

    if (this._workspaceSettings) {
      const plistContent = settings.build(this._workspaceSettings);
      writeFileSync(settingsPath, plistContent, "utf-8");
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

    if (this._workspaceSettingsLoaded && this._workspaceSettings) {
      this.saveWorkspaceSettings();
    }

    if (this._schemeManagementLoaded && this._schemeManagement) {
      this.saveSchemeManagement();
    }
  }
}
