import type { XcodeProject } from "./XcodeProject";
import type { PBXNativeTarget } from "./PBXNativeTarget";
import { PBXCopyFilesBuildPhase } from "./PBXSourcesBuildPhase";

export type ValidationSeverity = "error" | "warning";

export interface ValidationIssue {
  /** Severity of the issue */
  severity: ValidationSeverity;
  /** Short identifier for the issue type */
  code: string;
  /** Human-readable description of the issue */
  message: string;
  /** The target affected, if applicable */
  target?: PBXNativeTarget;
  /** Additional context for debugging */
  context?: Record<string, unknown>;
}

/**
 * Validates an Xcode project and returns any issues found.
 *
 * This catches common configuration errors that would cause App Store submission failures.
 */
export function validateProject(project: XcodeProject): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  issues.push(...validateWatchAppEmbedding(project));
  issues.push(...validateAppClipEmbedding(project));

  return issues;
}

/**
 * Validates that Watch apps are correctly embedded in the main app's Watch/ subdirectory.
 *
 * Apple requires Watch apps to be placed at `Payload/MainApp.app/Watch/WatchApp.app`.
 * This is controlled by a PBXCopyFilesBuildPhase with:
 * - dstPath = "$(CONTENTS_FOLDER_PATH)/Watch"
 * - dstSubfolderSpec = 16
 */
function validateWatchAppEmbedding(project: XcodeProject): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const rootObject = project.rootObject;

  // Find all Watch app targets
  const watchTargets = rootObject.props.targets.filter(
    (target) =>
      "isWatchOSTarget" in target &&
      typeof target.isWatchOSTarget === "function" &&
      target.isWatchOSTarget()
  ) as PBXNativeTarget[];

  if (watchTargets.length === 0) {
    return issues;
  }

  // Find the main app target (typically the one that embeds watch content)
  const mainTarget = rootObject.getMainAppTarget("ios");
  if (!mainTarget) {
    // Can't validate without a main target
    return issues;
  }

  // Look for "Embed Watch Content" build phase
  const embedWatchPhase = mainTarget.props.buildPhases.find(
    (phase) =>
      PBXCopyFilesBuildPhase.is(phase) &&
      phase.props.name === "Embed Watch Content"
  ) as PBXCopyFilesBuildPhase | undefined;

  for (const watchTarget of watchTargets) {
    // Check if this watch target's product is in the embed phase
    const productRef = watchTarget.props.productReference;
    if (!productRef) {
      continue;
    }

    if (!embedWatchPhase) {
      issues.push({
        severity: "error",
        code: "WATCH_EMBED_MISSING",
        message: `Watch target "${watchTarget.props.name}" is not embedded. Missing "Embed Watch Content" build phase in main target.`,
        target: watchTarget,
        context: {
          watchTargetUuid: watchTarget.uuid,
          mainTargetUuid: mainTarget.uuid,
        },
      });
      continue;
    }

    // Check if the embed phase has correct settings
    if (embedWatchPhase.props.dstPath !== "$(CONTENTS_FOLDER_PATH)/Watch") {
      issues.push({
        severity: "error",
        code: "WATCH_EMBED_WRONG_PATH",
        message: `Watch target "${watchTarget.props.name}" embed phase has incorrect dstPath. Expected "$(CONTENTS_FOLDER_PATH)/Watch" but got "${embedWatchPhase.props.dstPath}". This will cause App Store submission to fail with: "The bundle is not contained in a correctly named directory. It should be under Watch."`,
        target: watchTarget,
        context: {
          currentDstPath: embedWatchPhase.props.dstPath,
          expectedDstPath: "$(CONTENTS_FOLDER_PATH)/Watch",
        },
      });
    }

    if (embedWatchPhase.props.dstSubfolderSpec !== 16) {
      issues.push({
        severity: "error",
        code: "WATCH_EMBED_WRONG_SUBFOLDER",
        message: `Watch target "${watchTarget.props.name}" embed phase has incorrect dstSubfolderSpec. Expected 16 (Products Directory) but got ${embedWatchPhase.props.dstSubfolderSpec}.`,
        target: watchTarget,
        context: {
          currentDstSubfolderSpec: embedWatchPhase.props.dstSubfolderSpec,
          expectedDstSubfolderSpec: 16,
        },
      });
    }

    // Check if the watch app product is actually in the embed files
    const isEmbedded = embedWatchPhase.props.files.some(
      (file) => file.props.fileRef?.uuid === productRef.uuid
    );

    if (!isEmbedded) {
      issues.push({
        severity: "error",
        code: "WATCH_NOT_IN_EMBED",
        message: `Watch target "${watchTarget.props.name}" product is not included in the "Embed Watch Content" build phase.`,
        target: watchTarget,
        context: {
          productRefUuid: productRef.uuid,
          embedPhaseFiles: embedWatchPhase.props.files.map((f) => f.uuid),
        },
      });
    }
  }

  return issues;
}

/**
 * Validates that App Clips are correctly embedded in the main app's AppClips/ subdirectory.
 *
 * Apple requires App Clips to be placed at `Payload/MainApp.app/AppClips/AppClip.app`.
 * This is controlled by a PBXCopyFilesBuildPhase with:
 * - dstPath = "$(CONTENTS_FOLDER_PATH)/AppClips"
 * - dstSubfolderSpec = 16
 */
function validateAppClipEmbedding(project: XcodeProject): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const rootObject = project.rootObject;

  // Find all App Clip targets
  const appClipTargets = rootObject.props.targets.filter(
    (target) =>
      "props" in target &&
      target.props.productType ===
        "com.apple.product-type.application.on-demand-install-capable"
  ) as PBXNativeTarget[];

  if (appClipTargets.length === 0) {
    return issues;
  }

  // Find the main app target
  const mainTarget = rootObject.getMainAppTarget("ios");
  if (!mainTarget) {
    return issues;
  }

  // Look for "Embed App Clips" build phase
  const embedAppClipPhase = mainTarget.props.buildPhases.find(
    (phase) =>
      PBXCopyFilesBuildPhase.is(phase) && phase.props.name === "Embed App Clips"
  ) as PBXCopyFilesBuildPhase | undefined;

  for (const appClipTarget of appClipTargets) {
    const productRef = appClipTarget.props.productReference;
    if (!productRef) {
      continue;
    }

    if (!embedAppClipPhase) {
      issues.push({
        severity: "error",
        code: "APPCLIP_EMBED_MISSING",
        message: `App Clip target "${appClipTarget.props.name}" is not embedded. Missing "Embed App Clips" build phase in main target.`,
        target: appClipTarget,
        context: {
          appClipTargetUuid: appClipTarget.uuid,
          mainTargetUuid: mainTarget.uuid,
        },
      });
      continue;
    }

    if (embedAppClipPhase.props.dstPath !== "$(CONTENTS_FOLDER_PATH)/AppClips") {
      issues.push({
        severity: "error",
        code: "APPCLIP_EMBED_WRONG_PATH",
        message: `App Clip target "${appClipTarget.props.name}" embed phase has incorrect dstPath. Expected "$(CONTENTS_FOLDER_PATH)/AppClips" but got "${embedAppClipPhase.props.dstPath}".`,
        target: appClipTarget,
        context: {
          currentDstPath: embedAppClipPhase.props.dstPath,
          expectedDstPath: "$(CONTENTS_FOLDER_PATH)/AppClips",
        },
      });
    }

    if (embedAppClipPhase.props.dstSubfolderSpec !== 16) {
      issues.push({
        severity: "error",
        code: "APPCLIP_EMBED_WRONG_SUBFOLDER",
        message: `App Clip target "${appClipTarget.props.name}" embed phase has incorrect dstSubfolderSpec. Expected 16 (Products Directory) but got ${embedAppClipPhase.props.dstSubfolderSpec}.`,
        target: appClipTarget,
        context: {
          currentDstSubfolderSpec: embedAppClipPhase.props.dstSubfolderSpec,
          expectedDstSubfolderSpec: 16,
        },
      });
    }

    const isEmbedded = embedAppClipPhase.props.files.some(
      (file) => file.props.fileRef?.uuid === productRef.uuid
    );

    if (!isEmbedded) {
      issues.push({
        severity: "error",
        code: "APPCLIP_NOT_IN_EMBED",
        message: `App Clip target "${appClipTarget.props.name}" product is not included in the "Embed App Clips" build phase.`,
        target: appClipTarget,
        context: {
          productRefUuid: productRef.uuid,
        },
      });
    }
  }

  return issues;
}
