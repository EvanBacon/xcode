/**
 * TypeScript definitions for Xcode workspace settings files (WorkspaceSettings.xcsettings)
 *
 * These plist files store workspace configuration in xcshareddata directories.
 */

/** Workspace settings configuration */
export interface WorkspaceSettings {
  /** Build system type: "Original" (legacy) or "New" (modern, default) */
  BuildSystemType?: "Original" | "New";

  /** Derived data location style: "Default", "WorkspaceRelativePath", or "CustomLocation" */
  DerivedDataLocationStyle?: "Default" | "WorkspaceRelativePath" | "CustomLocation";

  /** Custom derived data location path (when DerivedDataLocationStyle is "CustomLocation") */
  DerivedDataCustomLocation?: string;

  /** Whether to auto-create schemes for targets */
  IDEWorkspaceSharedSettings_AutocreateContextsIfNeeded?: boolean;

  /** Whether Xcode previews are enabled */
  PreviewsEnabled?: boolean;

  /** Build location type (use project settings, derived data, etc.) */
  BuildLocationStyle?: "UseAppPreferences" | "UseNewBuildSystem" | "UsePerConfigurationBuildLocations" | "UseTargetSettings";

  /** Live issues enabled */
  LiveSourceIssuesEnabled?: boolean;

  /** Code coverage enabled for test targets */
  GatherCoverageData?: boolean;

  /** Index while building for workspace */
  IDEIndexEnableInWorkspace?: boolean;
}
