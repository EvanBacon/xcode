/**
 * Writer for Xcode workspace settings files (WorkspaceSettings.xcsettings)
 *
 * Uses @expo/plist to serialize TypeScript objects to plist format.
 */
import plist from "@expo/plist";

import type { WorkspaceSettings } from "./types";

/**
 * Build a workspace settings plist string from a typed object.
 */
export function build(settings: WorkspaceSettings): string {
  const obj: Record<string, unknown> = {};

  if (settings.BuildSystemType !== undefined) {
    obj.BuildSystemType = settings.BuildSystemType;
  }

  if (settings.DerivedDataLocationStyle !== undefined) {
    obj.DerivedDataLocationStyle = settings.DerivedDataLocationStyle;
  }

  if (settings.DerivedDataCustomLocation !== undefined) {
    obj.DerivedDataCustomLocation = settings.DerivedDataCustomLocation;
  }

  if (settings.IDEWorkspaceSharedSettings_AutocreateContextsIfNeeded !== undefined) {
    obj.IDEWorkspaceSharedSettings_AutocreateContextsIfNeeded =
      settings.IDEWorkspaceSharedSettings_AutocreateContextsIfNeeded;
  }

  if (settings.PreviewsEnabled !== undefined) {
    obj.PreviewsEnabled = settings.PreviewsEnabled;
  }

  if (settings.BuildLocationStyle !== undefined) {
    obj.BuildLocationStyle = settings.BuildLocationStyle;
  }

  if (settings.LiveSourceIssuesEnabled !== undefined) {
    obj.LiveSourceIssuesEnabled = settings.LiveSourceIssuesEnabled;
  }

  if (settings.GatherCoverageData !== undefined) {
    obj.GatherCoverageData = settings.GatherCoverageData;
  }

  if (settings.IDEIndexEnableInWorkspace !== undefined) {
    obj.IDEIndexEnableInWorkspace = settings.IDEIndexEnableInWorkspace;
  }

  return plist.build(obj);
}
