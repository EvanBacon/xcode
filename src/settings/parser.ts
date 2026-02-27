/**
 * Parser for Xcode workspace settings files (WorkspaceSettings.xcsettings)
 *
 * Uses @expo/plist to parse plist into TypeScript objects.
 */
import plist from "@expo/plist";

import type { WorkspaceSettings } from "./types";

/**
 * Parse a workspace settings plist string into a typed object.
 */
export function parse(plistString: string): WorkspaceSettings {
  const parsed = plist.parse(plistString) as Record<string, unknown>;

  const result: WorkspaceSettings = {};

  if (typeof parsed.BuildSystemType === "string") {
    result.BuildSystemType = parsed.BuildSystemType as WorkspaceSettings["BuildSystemType"];
  }

  if (typeof parsed.DerivedDataLocationStyle === "string") {
    result.DerivedDataLocationStyle = parsed.DerivedDataLocationStyle as WorkspaceSettings["DerivedDataLocationStyle"];
  }

  if (typeof parsed.DerivedDataCustomLocation === "string") {
    result.DerivedDataCustomLocation = parsed.DerivedDataCustomLocation;
  }

  if (typeof parsed.IDEWorkspaceSharedSettings_AutocreateContextsIfNeeded === "boolean") {
    result.IDEWorkspaceSharedSettings_AutocreateContextsIfNeeded = parsed.IDEWorkspaceSharedSettings_AutocreateContextsIfNeeded;
  }

  if (typeof parsed.PreviewsEnabled === "boolean") {
    result.PreviewsEnabled = parsed.PreviewsEnabled;
  }

  if (typeof parsed.BuildLocationStyle === "string") {
    result.BuildLocationStyle = parsed.BuildLocationStyle as WorkspaceSettings["BuildLocationStyle"];
  }

  if (typeof parsed.LiveSourceIssuesEnabled === "boolean") {
    result.LiveSourceIssuesEnabled = parsed.LiveSourceIssuesEnabled;
  }

  if (typeof parsed.GatherCoverageData === "boolean") {
    result.GatherCoverageData = parsed.GatherCoverageData;
  }

  if (typeof parsed.IDEIndexEnableInWorkspace === "boolean") {
    result.IDEIndexEnableInWorkspace = parsed.IDEIndexEnableInWorkspace;
  }

  return result;
}
