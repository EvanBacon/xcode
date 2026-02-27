/**
 * High-level API for Xcode scheme files (.xcscheme).
 *
 * Provides convenient methods for creating and manipulating schemes.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";

import * as scheme from "../scheme";
import type {
  XCScheme as SchemeData,
  BuildableReference,
  BuildActionEntry,
} from "../scheme/types";
import type { PBXNativeTarget } from "./PBXNativeTarget";
import type { XcodeProject } from "./XcodeProject";

/** Build configurations for a target in BuildAction */
export interface BuildFor {
  running?: boolean;
  testing?: boolean;
  profiling?: boolean;
  archiving?: boolean;
  analyzing?: boolean;
}

const DEFAULT_BUILD_FOR: Required<BuildFor> = {
  running: true,
  testing: true,
  profiling: true,
  archiving: true,
  analyzing: true,
};

/**
 * High-level class for working with Xcode scheme files.
 */
export class XCScheme {
  /** The scheme name (derived from filename) */
  name: string;

  /** The parsed scheme data */
  props: SchemeData;

  /** Path to the .xcscheme file (may be undefined for new schemes) */
  filePath?: string;

  private constructor(name: string, props: SchemeData, filePath?: string) {
    this.name = name;
    this.props = props;
    this.filePath = filePath;
  }

  /**
   * Load a scheme from a file.
   */
  static open(filePath: string): XCScheme {
    const xml = readFileSync(filePath, "utf-8");
    const props = scheme.parse(xml);
    const name = path.basename(filePath, ".xcscheme");
    return new XCScheme(name, props, filePath);
  }

  /**
   * Create a new empty scheme.
   */
  static create(name: string, props?: Partial<SchemeData>): XCScheme {
    const defaultProps: SchemeData = {
      version: "1.7",
      buildAction: {
        parallelizeBuildables: true,
        buildImplicitDependencies: true,
        entries: [],
      },
      testAction: {
        buildConfiguration: "Debug",
        selectedDebuggerIdentifier: "Xcode.DebuggerFoundation.Debugger.LLDB",
        selectedLauncherIdentifier: "Xcode.DebuggerFoundation.Launcher.LLDB",
        shouldUseLaunchSchemeArgsEnv: true,
        testables: [],
      },
      launchAction: {
        buildConfiguration: "Debug",
        selectedDebuggerIdentifier: "Xcode.DebuggerFoundation.Debugger.LLDB",
        selectedLauncherIdentifier: "Xcode.DebuggerFoundation.Launcher.LLDB",
        launchStyle: "0",
        useCustomWorkingDirectory: false,
        ignoresPersistentStateOnLaunch: false,
        debugDocumentVersioning: true,
        debugServiceExtension: "internal",
        allowLocationSimulation: true,
      },
      profileAction: {
        buildConfiguration: "Release",
        shouldUseLaunchSchemeArgsEnv: true,
        savedToolIdentifier: "",
        useCustomWorkingDirectory: false,
        debugDocumentVersioning: true,
      },
      analyzeAction: {
        buildConfiguration: "Debug",
      },
      archiveAction: {
        buildConfiguration: "Release",
        revealArchiveInOrganizer: true,
      },
    };

    // Merge provided props with defaults
    const mergedProps = { ...defaultProps };
    if (props) {
      Object.assign(mergedProps, props);
    }

    return new XCScheme(name, mergedProps);
  }

  /**
   * Create a scheme for a target with sensible defaults.
   */
  static createForTarget(
    target: PBXNativeTarget,
    name?: string,
    projectPath?: string
  ): XCScheme {
    const schemeName = name ?? target.props.name;
    const containerPath = projectPath
      ? `container:${path.basename(projectPath)}`
      : `container:${path.basename(target.getXcodeProject().filePath, "/project.pbxproj")}.xcodeproj`;

    const buildableRef = createBuildableReference(target, containerPath);

    const xcscheme = XCScheme.create(schemeName);

    // Add build target
    xcscheme.addBuildTarget(buildableRef);

    // Set launch target
    xcscheme.setLaunchTarget(buildableRef);

    return xcscheme;
  }

  /**
   * Save the scheme to disk.
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

    // Ensure directory exists
    const dir = path.dirname(targetPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    const xml = scheme.build(this.props);
    writeFileSync(targetPath, xml, "utf-8");
    this.filePath = targetPath;
  }

  /**
   * Get the XML representation of the scheme.
   */
  toXML(): string {
    return scheme.build(this.props);
  }

  /**
   * Get the buildable reference for a target UUID from this scheme.
   */
  getBuildableReference(targetUuid: string): BuildableReference | null {
    const entries = this.props.buildAction?.entries ?? [];
    for (const entry of entries) {
      if (entry.buildableReference?.blueprintIdentifier === targetUuid) {
        return entry.buildableReference;
      }
    }
    return null;
  }

  /**
   * Add a target to the build action.
   */
  addBuildTarget(ref: BuildableReference, buildFor?: BuildFor): void {
    if (!this.props.buildAction) {
      this.props.buildAction = {
        parallelizeBuildables: true,
        buildImplicitDependencies: true,
        entries: [],
      };
    }

    if (!this.props.buildAction.entries) {
      this.props.buildAction.entries = [];
    }

    // Check if already added
    const existing = this.props.buildAction.entries.find(
      (e) => e.buildableReference?.blueprintIdentifier === ref.blueprintIdentifier
    );
    if (existing) {
      return;
    }

    const config = { ...DEFAULT_BUILD_FOR, ...buildFor };

    const entry: BuildActionEntry = {
      buildForRunning: config.running,
      buildForTesting: config.testing,
      buildForProfiling: config.profiling,
      buildForArchiving: config.archiving,
      buildForAnalyzing: config.analyzing,
      buildableReference: ref,
    };

    this.props.buildAction.entries.push(entry);
  }

  /**
   * Add a testable reference to the test action.
   */
  addTestTarget(ref: BuildableReference): void {
    if (!this.props.testAction) {
      this.props.testAction = {
        buildConfiguration: "Debug",
        testables: [],
      };
    }

    if (!this.props.testAction.testables) {
      this.props.testAction.testables = [];
    }

    // Check if already added
    const existing = this.props.testAction.testables.find(
      (t) => t.buildableReference?.blueprintIdentifier === ref.blueprintIdentifier
    );
    if (existing) {
      return;
    }

    this.props.testAction.testables.push({
      skipped: false,
      buildableReference: ref,
    });
  }

  /**
   * Set the launch target for the scheme.
   */
  setLaunchTarget(ref: BuildableReference): void {
    if (!this.props.launchAction) {
      this.props.launchAction = {
        buildConfiguration: "Debug",
      };
    }

    this.props.launchAction.buildableProductRunnable = {
      runnableDebuggingMode: "0",
      buildableReference: ref,
    };

    // Also set for profile action
    if (!this.props.profileAction) {
      this.props.profileAction = {
        buildConfiguration: "Release",
      };
    }

    this.props.profileAction.buildableProductRunnable = {
      runnableDebuggingMode: "0",
      buildableReference: ref,
    };
  }

  /**
   * Set an environment variable for the launch action.
   */
  setLaunchEnvironmentVariable(
    key: string,
    value: string,
    isEnabled = true
  ): void {
    if (!this.props.launchAction) {
      this.props.launchAction = {
        buildConfiguration: "Debug",
      };
    }

    if (!this.props.launchAction.environmentVariables) {
      this.props.launchAction.environmentVariables = [];
    }

    // Update if exists
    const existing = this.props.launchAction.environmentVariables.find(
      (v) => v.key === key
    );
    if (existing) {
      existing.value = value;
      existing.isEnabled = isEnabled;
      return;
    }

    this.props.launchAction.environmentVariables.push({
      key,
      value,
      isEnabled,
    });
  }

  /**
   * Add a command line argument to the launch action.
   */
  addLaunchArgument(argument: string, isEnabled = true): void {
    if (!this.props.launchAction) {
      this.props.launchAction = {
        buildConfiguration: "Debug",
      };
    }

    if (!this.props.launchAction.commandLineArguments) {
      this.props.launchAction.commandLineArguments = [];
    }

    // Check if already added
    const existing = this.props.launchAction.commandLineArguments.find(
      (a) => a.argument === argument
    );
    if (existing) {
      existing.isEnabled = isEnabled;
      return;
    }

    this.props.launchAction.commandLineArguments.push({
      argument,
      isEnabled,
    });
  }
}

/**
 * Helper to create a BuildableReference from a PBXNativeTarget.
 */
export function createBuildableReference(
  target: PBXNativeTarget,
  referencedContainer: string
): BuildableReference {
  const productName =
    target.props.productReference?.getDisplayName() ?? `${target.props.name}.app`;

  return {
    buildableIdentifier: "primary",
    blueprintIdentifier: target.uuid,
    buildableName: productName,
    blueprintName: target.props.name,
    referencedContainer,
  };
}
