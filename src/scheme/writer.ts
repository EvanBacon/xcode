/**
 * Writer for Xcode scheme files (.xcscheme)
 *
 * Serializes TypeScript objects back to XML format.
 */
import type {
  XCScheme,
  BuildAction,
  BuildActionEntry,
  BuildableReference,
  ExecutionAction,
  ActionContent,
  TestAction,
  TestableReference,
  TestPlanReference,
  LaunchAction,
  BuildableProductRunnable,
  RemoteRunnable,
  LocationScenarioReference,
  StoreKitConfigurationFileReference,
  ProfileAction,
  AnalyzeAction,
  ArchiveAction,
  CommandLineArgument,
  EnvironmentVariable,
} from "./types";

/**
 * Build an xcscheme XML string from a typed XCScheme object.
 */
export function build(scheme: XCScheme): string {
  const lines: string[] = [];

  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push("<Scheme");

  const schemeAttrs = buildSchemeAttributes(scheme);
  lines.push(...schemeAttrs.map((a) => `   ${a}`));
  lines[lines.length - 1] += ">";

  if (scheme.buildAction) {
    lines.push(...buildBuildAction(scheme.buildAction, 1));
  }

  if (scheme.testAction) {
    lines.push(...buildTestAction(scheme.testAction, 1));
  }

  if (scheme.launchAction) {
    lines.push(...buildLaunchAction(scheme.launchAction, 1));
  }

  if (scheme.profileAction) {
    lines.push(...buildProfileAction(scheme.profileAction, 1));
  }

  if (scheme.analyzeAction) {
    lines.push(...buildAnalyzeAction(scheme.analyzeAction, 1));
  }

  if (scheme.archiveAction) {
    lines.push(...buildArchiveAction(scheme.archiveAction, 1));
  }

  lines.push("</Scheme>");

  return lines.join("\n") + "\n";
}

function buildSchemeAttributes(scheme: XCScheme): string[] {
  const attrs: string[] = [];

  if (scheme.lastUpgradeVersion !== undefined) {
    attrs.push(`LastUpgradeVersion = "${scheme.lastUpgradeVersion}"`);
  }
  if (scheme.version !== undefined) {
    attrs.push(`version = "${scheme.version}"`);
  }

  return attrs;
}

function buildBuildAction(action: BuildAction, depth: number): string[] {
  const lines: string[] = [];
  const indent = getIndent(depth);
  const attrs: string[] = [];

  if (action.parallelizeBuildables !== undefined) {
    attrs.push(
      `parallelizeBuildables = "${boolToString(action.parallelizeBuildables)}"`
    );
  }
  if (action.buildImplicitDependencies !== undefined) {
    attrs.push(
      `buildImplicitDependencies = "${boolToString(
        action.buildImplicitDependencies
      )}"`
    );
  }
  if (action.runPostActionsOnFailure !== undefined) {
    attrs.push(
      `runPostActionsOnFailure = "${boolToString(
        action.runPostActionsOnFailure
      )}"`
    );
  }
  if (action.buildArchitectures !== undefined) {
    attrs.push(`buildArchitectures = "${action.buildArchitectures}"`);
  }

  lines.push(`${indent}<BuildAction`);
  for (const attr of attrs) {
    lines.push(`${indent}   ${attr}`);
  }
  lines[lines.length - 1] += ">";

  if (action.preActions && action.preActions.length > 0) {
    lines.push(...buildExecutionActions("PreActions", action.preActions, depth + 1));
  }

  if (action.postActions && action.postActions.length > 0) {
    lines.push(...buildExecutionActions("PostActions", action.postActions, depth + 1));
  }

  if (action.entries && action.entries.length > 0) {
    lines.push(`${getIndent(depth + 1)}<BuildActionEntries>`);
    for (const entry of action.entries) {
      lines.push(...buildBuildActionEntry(entry, depth + 2));
    }
    lines.push(`${getIndent(depth + 1)}</BuildActionEntries>`);
  }

  lines.push(`${indent}</BuildAction>`);

  return lines;
}

function buildBuildActionEntry(
  entry: BuildActionEntry,
  depth: number
): string[] {
  const lines: string[] = [];
  const indent = getIndent(depth);
  const attrs: string[] = [];

  if (entry.buildForTesting !== undefined) {
    attrs.push(`buildForTesting = "${boolToString(entry.buildForTesting)}"`);
  }
  if (entry.buildForRunning !== undefined) {
    attrs.push(`buildForRunning = "${boolToString(entry.buildForRunning)}"`);
  }
  if (entry.buildForProfiling !== undefined) {
    attrs.push(`buildForProfiling = "${boolToString(entry.buildForProfiling)}"`);
  }
  if (entry.buildForArchiving !== undefined) {
    attrs.push(`buildForArchiving = "${boolToString(entry.buildForArchiving)}"`);
  }
  if (entry.buildForAnalyzing !== undefined) {
    attrs.push(`buildForAnalyzing = "${boolToString(entry.buildForAnalyzing)}"`);
  }

  lines.push(`${indent}<BuildActionEntry`);
  for (const attr of attrs) {
    lines.push(`${indent}   ${attr}`);
  }
  lines[lines.length - 1] += ">";

  if (entry.buildableReference) {
    lines.push(...buildBuildableReference(entry.buildableReference, depth + 1));
  }

  lines.push(`${indent}</BuildActionEntry>`);

  return lines;
}

function buildBuildableReference(
  ref: BuildableReference,
  depth: number
): string[] {
  const lines: string[] = [];
  const indent = getIndent(depth);

  lines.push(`${indent}<BuildableReference`);
  lines.push(`${indent}   BuildableIdentifier = "${ref.buildableIdentifier}"`);
  lines.push(`${indent}   BlueprintIdentifier = "${ref.blueprintIdentifier}"`);
  lines.push(`${indent}   BuildableName = "${escapeXml(ref.buildableName)}"`);
  lines.push(`${indent}   BlueprintName = "${escapeXml(ref.blueprintName)}"`);
  lines.push(
    `${indent}   ReferencedContainer = "${escapeXml(ref.referencedContainer)}">`
  );
  lines.push(`${indent}</BuildableReference>`);

  return lines;
}

function buildExecutionActions(
  containerName: string,
  actions: ExecutionAction[],
  depth: number
): string[] {
  const lines: string[] = [];
  const indent = getIndent(depth);

  lines.push(`${indent}<${containerName}>`);

  for (const action of actions) {
    lines.push(...buildExecutionAction(action, depth + 1));
  }

  lines.push(`${indent}</${containerName}>`);

  return lines;
}

function buildExecutionAction(action: ExecutionAction, depth: number): string[] {
  const lines: string[] = [];
  const indent = getIndent(depth);

  lines.push(`${indent}<ExecutionAction`);
  if (action.actionType !== undefined) {
    lines.push(`${indent}   ActionType = "${action.actionType}">`);
  } else {
    lines[lines.length - 1] += ">";
  }

  if (action.actionContent) {
    lines.push(...buildActionContent(action.actionContent, depth + 1));
  }

  lines.push(`${indent}</ExecutionAction>`);

  return lines;
}

function buildActionContent(content: ActionContent, depth: number): string[] {
  const lines: string[] = [];
  const indent = getIndent(depth);
  const attrs: string[] = [];

  if (content.title !== undefined) {
    attrs.push(`title = "${escapeXml(content.title)}"`);
  }
  if (content.scriptText !== undefined) {
    attrs.push(`scriptText = "${escapeXml(content.scriptText)}"`);
  }
  if (content.shellToInvoke !== undefined) {
    attrs.push(`shellToInvoke = "${content.shellToInvoke}"`);
  }

  lines.push(`${indent}<ActionContent`);
  for (const attr of attrs) {
    lines.push(`${indent}   ${attr}`);
  }

  if (content.environmentBuildable) {
    lines[lines.length - 1] += ">";
    lines.push(`${getIndent(depth + 1)}<EnvironmentBuildable>`);
    lines.push(...buildBuildableReference(content.environmentBuildable, depth + 2));
    lines.push(`${getIndent(depth + 1)}</EnvironmentBuildable>`);
    lines.push(`${indent}</ActionContent>`);
  } else {
    lines[lines.length - 1] += ">";
    lines.push(`${indent}</ActionContent>`);
  }

  return lines;
}

function buildTestAction(action: TestAction, depth: number): string[] {
  const lines: string[] = [];
  const indent = getIndent(depth);
  const attrs: string[] = [];

  if (action.buildConfiguration !== undefined) {
    attrs.push(`buildConfiguration = "${action.buildConfiguration}"`);
  }
  if (action.selectedDebuggerIdentifier !== undefined) {
    attrs.push(
      `selectedDebuggerIdentifier = "${action.selectedDebuggerIdentifier}"`
    );
  }
  if (action.selectedLauncherIdentifier !== undefined) {
    attrs.push(
      `selectedLauncherIdentifier = "${action.selectedLauncherIdentifier}"`
    );
  }
  if (action.shouldUseLaunchSchemeArgsEnv !== undefined) {
    attrs.push(
      `shouldUseLaunchSchemeArgsEnv = "${boolToString(
        action.shouldUseLaunchSchemeArgsEnv
      )}"`
    );
  }
  if (action.shouldAutocreateTestPlan !== undefined) {
    attrs.push(
      `shouldAutocreateTestPlan = "${boolToString(
        action.shouldAutocreateTestPlan
      )}"`
    );
  }
  if (action.preferredScreenCaptureFormat !== undefined) {
    attrs.push(
      `preferredScreenCaptureFormat = "${action.preferredScreenCaptureFormat}"`
    );
  }
  if (action.codeCoverageEnabled !== undefined) {
    attrs.push(
      `codeCoverageEnabled = "${boolToString(action.codeCoverageEnabled)}"`
    );
  }
  if (action.onlyGenerateCoverageForSpecifiedTargets !== undefined) {
    attrs.push(
      `onlyGenerateCoverageForSpecifiedTargets = "${boolToString(
        action.onlyGenerateCoverageForSpecifiedTargets
      )}"`
    );
  }

  lines.push(`${indent}<TestAction`);
  for (const attr of attrs) {
    lines.push(`${indent}   ${attr}`);
  }
  lines[lines.length - 1] += ">";

  if (action.preActions && action.preActions.length > 0) {
    lines.push(...buildExecutionActions("PreActions", action.preActions, depth + 1));
  }

  if (action.postActions && action.postActions.length > 0) {
    lines.push(...buildExecutionActions("PostActions", action.postActions, depth + 1));
  }

  if (action.testPlans && action.testPlans.length > 0) {
    lines.push(`${getIndent(depth + 1)}<TestPlans>`);
    for (const plan of action.testPlans) {
      lines.push(...buildTestPlanReference(plan, depth + 2));
    }
    lines.push(`${getIndent(depth + 1)}</TestPlans>`);
  }

  if (action.macroExpansion) {
    lines.push(`${getIndent(depth + 1)}<MacroExpansion>`);
    lines.push(...buildBuildableReference(action.macroExpansion, depth + 2));
    lines.push(`${getIndent(depth + 1)}</MacroExpansion>`);
  }

  if (action.testables && action.testables.length > 0) {
    lines.push(`${getIndent(depth + 1)}<Testables>`);
    for (const testable of action.testables) {
      lines.push(...buildTestableReference(testable, depth + 2));
    }
    lines.push(`${getIndent(depth + 1)}</Testables>`);
  } else if (action.testables !== undefined) {
    // Output empty Testables if explicitly set
    lines.push(`${getIndent(depth + 1)}<Testables>`);
    lines.push(`${getIndent(depth + 1)}</Testables>`);
  }

  if (action.commandLineArguments && action.commandLineArguments.length > 0) {
    lines.push(...buildCommandLineArguments(action.commandLineArguments, depth + 1));
  }

  if (action.environmentVariables && action.environmentVariables.length > 0) {
    lines.push(...buildEnvironmentVariables(action.environmentVariables, depth + 1));
  }

  lines.push(`${indent}</TestAction>`);

  return lines;
}

function buildTestableReference(
  ref: TestableReference,
  depth: number
): string[] {
  const lines: string[] = [];
  const indent = getIndent(depth);
  const attrs: string[] = [];

  if (ref.skipped !== undefined) {
    attrs.push(`skipped = "${boolToString(ref.skipped)}"`);
  }
  if (ref.parallelizable !== undefined) {
    attrs.push(`parallelizable = "${boolToString(ref.parallelizable)}"`);
  }
  if (ref.useTestSelectionWhitelist !== undefined) {
    attrs.push(
      `useTestSelectionWhitelist = "${boolToString(
        ref.useTestSelectionWhitelist
      )}"`
    );
  }

  lines.push(`${indent}<TestableReference`);
  for (const attr of attrs) {
    lines.push(`${indent}   ${attr}`);
  }
  lines[lines.length - 1] += ">";

  if (ref.buildableReference) {
    lines.push(...buildBuildableReference(ref.buildableReference, depth + 1));
  }

  if (ref.skippedTests && ref.skippedTests.length > 0) {
    lines.push(`${getIndent(depth + 1)}<SkippedTests>`);
    for (const test of ref.skippedTests) {
      lines.push(`${getIndent(depth + 2)}<Test`);
      lines.push(`${getIndent(depth + 2)}   Identifier = "${test.identifier}">`);
      lines.push(`${getIndent(depth + 2)}</Test>`);
    }
    lines.push(`${getIndent(depth + 1)}</SkippedTests>`);
  }

  if (ref.selectedTests && ref.selectedTests.length > 0) {
    lines.push(`${getIndent(depth + 1)}<SelectedTests>`);
    for (const test of ref.selectedTests) {
      lines.push(`${getIndent(depth + 2)}<Test`);
      lines.push(`${getIndent(depth + 2)}   Identifier = "${test.identifier}">`);
      lines.push(`${getIndent(depth + 2)}</Test>`);
    }
    lines.push(`${getIndent(depth + 1)}</SelectedTests>`);
  }

  lines.push(`${indent}</TestableReference>`);

  return lines;
}

function buildTestPlanReference(ref: TestPlanReference, depth: number): string[] {
  const lines: string[] = [];
  const indent = getIndent(depth);

  lines.push(`${indent}<TestPlanReference`);
  if (ref.default !== undefined) {
    lines.push(`${indent}   default = "${boolToString(ref.default)}"`);
  }
  lines.push(`${indent}   reference = "${ref.reference}">`);
  lines.push(`${indent}</TestPlanReference>`);

  return lines;
}

function buildLaunchAction(action: LaunchAction, depth: number): string[] {
  const lines: string[] = [];
  const indent = getIndent(depth);
  const attrs: string[] = [];

  if (action.buildConfiguration !== undefined) {
    attrs.push(`buildConfiguration = "${action.buildConfiguration}"`);
  }
  if (action.appClipInvocationURLString !== undefined) {
    attrs.push(
      `appClipInvocationURLString = "${escapeXml(action.appClipInvocationURLString)}"`
    );
  }
  if (action.selectedDebuggerIdentifier !== undefined) {
    attrs.push(
      `selectedDebuggerIdentifier = "${action.selectedDebuggerIdentifier}"`
    );
  }
  if (action.selectedLauncherIdentifier !== undefined) {
    attrs.push(
      `selectedLauncherIdentifier = "${action.selectedLauncherIdentifier}"`
    );
  }
  if (action.launchStyle !== undefined) {
    attrs.push(`launchStyle = "${action.launchStyle}"`);
  }
  if (action.askForAppToLaunch !== undefined) {
    attrs.push(
      `askForAppToLaunch = "${action.askForAppToLaunch ? "Yes" : "No"}"`
    );
  }
  if (action.useCustomWorkingDirectory !== undefined) {
    attrs.push(
      `useCustomWorkingDirectory = "${boolToString(
        action.useCustomWorkingDirectory
      )}"`
    );
  }
  if (action.customWorkingDirectory !== undefined) {
    attrs.push(`customWorkingDirectory = "${action.customWorkingDirectory}"`);
  }
  if (action.ignoresPersistentStateOnLaunch !== undefined) {
    attrs.push(
      `ignoresPersistentStateOnLaunch = "${boolToString(
        action.ignoresPersistentStateOnLaunch
      )}"`
    );
  }
  if (action.debugDocumentVersioning !== undefined) {
    attrs.push(
      `debugDocumentVersioning = "${boolToString(
        action.debugDocumentVersioning
      )}"`
    );
  }
  if (action.debugServiceExtension !== undefined) {
    attrs.push(`debugServiceExtension = "${action.debugServiceExtension}"`);
  }
  if (action.allowLocationSimulation !== undefined) {
    attrs.push(
      `allowLocationSimulation = "${boolToString(
        action.allowLocationSimulation
      )}"`
    );
  }
  if (action.customLaunchCommand !== undefined) {
    attrs.push(`customLaunchCommand = "${escapeXml(action.customLaunchCommand)}"`);
  }
  if (action.launchAutomaticallySubstyle !== undefined) {
    attrs.push(
      `launchAutomaticallySubstyle = "${action.launchAutomaticallySubstyle}"`
    );
  }

  lines.push(`${indent}<LaunchAction`);
  for (const attr of attrs) {
    lines.push(`${indent}   ${attr}`);
  }
  lines[lines.length - 1] += ">";

  if (action.preActions && action.preActions.length > 0) {
    lines.push(...buildExecutionActions("PreActions", action.preActions, depth + 1));
  }

  if (action.postActions && action.postActions.length > 0) {
    lines.push(...buildExecutionActions("PostActions", action.postActions, depth + 1));
  }

  if (action.buildableProductRunnable) {
    lines.push(
      ...buildBuildableProductRunnable(action.buildableProductRunnable, depth + 1)
    );
  }

  if (action.remoteRunnable) {
    lines.push(...buildRemoteRunnable(action.remoteRunnable, depth + 1));
  }

  if (action.macroExpansion) {
    lines.push(`${getIndent(depth + 1)}<MacroExpansion>`);
    lines.push(...buildBuildableReference(action.macroExpansion, depth + 2));
    lines.push(`${getIndent(depth + 1)}</MacroExpansion>`);
  }

  if (action.locationScenarioReference) {
    lines.push(
      ...buildLocationScenarioReference(action.locationScenarioReference, depth + 1)
    );
  }

  if (action.commandLineArguments && action.commandLineArguments.length > 0) {
    lines.push(...buildCommandLineArguments(action.commandLineArguments, depth + 1));
  }

  if (action.environmentVariables && action.environmentVariables.length > 0) {
    lines.push(...buildEnvironmentVariables(action.environmentVariables, depth + 1));
  }

  if (action.storeKitConfigurationFileReference) {
    lines.push(
      ...buildStoreKitConfigurationFileReference(
        action.storeKitConfigurationFileReference,
        depth + 1
      )
    );
  }

  lines.push(`${indent}</LaunchAction>`);

  return lines;
}

function buildBuildableProductRunnable(
  runnable: BuildableProductRunnable,
  depth: number
): string[] {
  const lines: string[] = [];
  const indent = getIndent(depth);

  lines.push(`${indent}<BuildableProductRunnable`);
  if (runnable.runnableDebuggingMode !== undefined) {
    lines.push(
      `${indent}   runnableDebuggingMode = "${runnable.runnableDebuggingMode}">`
    );
  } else {
    lines[lines.length - 1] += ">";
  }

  if (runnable.buildableReference) {
    lines.push(...buildBuildableReference(runnable.buildableReference, depth + 1));
  }

  lines.push(`${indent}</BuildableProductRunnable>`);

  return lines;
}

function buildRemoteRunnable(runnable: RemoteRunnable, depth: number): string[] {
  const lines: string[] = [];
  const indent = getIndent(depth);
  const attrs: string[] = [];

  if (runnable.runnableDebuggingMode !== undefined) {
    attrs.push(`runnableDebuggingMode = "${runnable.runnableDebuggingMode}"`);
  }
  if (runnable.bundleIdentifier !== undefined) {
    attrs.push(`BundleIdentifier = "${runnable.bundleIdentifier}"`);
  }
  if (runnable.remotePath !== undefined) {
    attrs.push(`RemotePath = "${runnable.remotePath}"`);
  }

  lines.push(`${indent}<RemoteRunnable`);
  for (const attr of attrs) {
    lines.push(`${indent}   ${attr}`);
  }
  lines[lines.length - 1] += ">";

  if (runnable.buildableReference) {
    lines.push(...buildBuildableReference(runnable.buildableReference, depth + 1));
  }

  lines.push(`${indent}</RemoteRunnable>`);

  return lines;
}

function buildLocationScenarioReference(
  ref: LocationScenarioReference,
  depth: number
): string[] {
  const lines: string[] = [];
  const indent = getIndent(depth);

  lines.push(`${indent}<LocationScenarioReference`);
  if (ref.identifier !== undefined) {
    lines.push(`${indent}   identifier = "${ref.identifier}"`);
  }
  if (ref.referenceType !== undefined) {
    lines.push(`${indent}   referenceType = "${ref.referenceType}">`);
  } else {
    lines[lines.length - 1] += ">";
  }
  lines.push(`${indent}</LocationScenarioReference>`);

  return lines;
}

function buildStoreKitConfigurationFileReference(
  ref: StoreKitConfigurationFileReference,
  depth: number
): string[] {
  const lines: string[] = [];
  const indent = getIndent(depth);

  lines.push(`${indent}<StoreKitConfigurationFileReference`);
  if (ref.identifier !== undefined) {
    lines.push(`${indent}   identifier = "${ref.identifier}">`);
  } else {
    lines[lines.length - 1] += ">";
  }
  lines.push(`${indent}</StoreKitConfigurationFileReference>`);

  return lines;
}

function buildProfileAction(action: ProfileAction, depth: number): string[] {
  const lines: string[] = [];
  const indent = getIndent(depth);
  const attrs: string[] = [];

  if (action.askForAppToLaunch !== undefined) {
    attrs.push(
      `askForAppToLaunch = "${action.askForAppToLaunch ? "YES" : "NO"}"`
    );
  }
  if (action.buildConfiguration !== undefined) {
    attrs.push(`buildConfiguration = "${action.buildConfiguration}"`);
  }
  if (action.appClipInvocationURLString !== undefined) {
    attrs.push(
      `appClipInvocationURLString = "${escapeXml(action.appClipInvocationURLString)}"`
    );
  }
  if (action.shouldUseLaunchSchemeArgsEnv !== undefined) {
    attrs.push(
      `shouldUseLaunchSchemeArgsEnv = "${boolToString(
        action.shouldUseLaunchSchemeArgsEnv
      )}"`
    );
  }
  if (action.savedToolIdentifier !== undefined) {
    attrs.push(`savedToolIdentifier = "${action.savedToolIdentifier}"`);
  }
  if (action.useCustomWorkingDirectory !== undefined) {
    attrs.push(
      `useCustomWorkingDirectory = "${boolToString(
        action.useCustomWorkingDirectory
      )}"`
    );
  }
  if (action.debugDocumentVersioning !== undefined) {
    attrs.push(
      `debugDocumentVersioning = "${boolToString(
        action.debugDocumentVersioning
      )}"`
    );
  }
  if (action.launchAutomaticallySubstyle !== undefined) {
    attrs.push(
      `launchAutomaticallySubstyle = "${action.launchAutomaticallySubstyle}"`
    );
  }

  lines.push(`${indent}<ProfileAction`);
  for (const attr of attrs) {
    lines.push(`${indent}   ${attr}`);
  }
  lines[lines.length - 1] += ">";

  if (action.preActions && action.preActions.length > 0) {
    lines.push(...buildExecutionActions("PreActions", action.preActions, depth + 1));
  }

  if (action.postActions && action.postActions.length > 0) {
    lines.push(...buildExecutionActions("PostActions", action.postActions, depth + 1));
  }

  if (action.buildableProductRunnable) {
    lines.push(
      ...buildBuildableProductRunnable(action.buildableProductRunnable, depth + 1)
    );
  }

  if (action.commandLineArguments && action.commandLineArguments.length > 0) {
    lines.push(...buildCommandLineArguments(action.commandLineArguments, depth + 1));
  }

  if (action.environmentVariables && action.environmentVariables.length > 0) {
    lines.push(...buildEnvironmentVariables(action.environmentVariables, depth + 1));
  }

  lines.push(`${indent}</ProfileAction>`);

  return lines;
}

function buildAnalyzeAction(action: AnalyzeAction, depth: number): string[] {
  const lines: string[] = [];
  const indent = getIndent(depth);

  lines.push(`${indent}<AnalyzeAction`);
  if (action.buildConfiguration !== undefined) {
    lines.push(`${indent}   buildConfiguration = "${action.buildConfiguration}">`);
  } else {
    lines[lines.length - 1] += ">";
  }

  if (action.preActions && action.preActions.length > 0) {
    lines.push(...buildExecutionActions("PreActions", action.preActions, depth + 1));
  }

  if (action.postActions && action.postActions.length > 0) {
    lines.push(...buildExecutionActions("PostActions", action.postActions, depth + 1));
  }

  lines.push(`${indent}</AnalyzeAction>`);

  return lines;
}

function buildArchiveAction(action: ArchiveAction, depth: number): string[] {
  const lines: string[] = [];
  const indent = getIndent(depth);
  const attrs: string[] = [];

  if (action.buildConfiguration !== undefined) {
    attrs.push(`buildConfiguration = "${action.buildConfiguration}"`);
  }
  if (action.customArchiveName !== undefined) {
    attrs.push(`customArchiveName = "${escapeXml(action.customArchiveName)}"`);
  }
  if (action.revealArchiveInOrganizer !== undefined) {
    attrs.push(
      `revealArchiveInOrganizer = "${boolToString(
        action.revealArchiveInOrganizer
      )}"`
    );
  }

  lines.push(`${indent}<ArchiveAction`);
  for (const attr of attrs) {
    lines.push(`${indent}   ${attr}`);
  }
  lines[lines.length - 1] += ">";

  if (action.preActions && action.preActions.length > 0) {
    lines.push(...buildExecutionActions("PreActions", action.preActions, depth + 1));
  }

  if (action.postActions && action.postActions.length > 0) {
    lines.push(...buildExecutionActions("PostActions", action.postActions, depth + 1));
  }

  lines.push(`${indent}</ArchiveAction>`);

  return lines;
}

function buildCommandLineArguments(
  args: CommandLineArgument[],
  depth: number
): string[] {
  const lines: string[] = [];
  const indent = getIndent(depth);

  lines.push(`${indent}<CommandLineArguments>`);

  for (const arg of args) {
    lines.push(`${getIndent(depth + 1)}<CommandLineArgument`);
    lines.push(`${getIndent(depth + 1)}   argument = "${escapeXml(arg.argument)}"`);
    if (arg.isEnabled !== undefined) {
      lines.push(
        `${getIndent(depth + 1)}   isEnabled = "${boolToString(arg.isEnabled)}">`
      );
    } else {
      lines[lines.length - 1] += ">";
    }
    lines.push(`${getIndent(depth + 1)}</CommandLineArgument>`);
  }

  lines.push(`${indent}</CommandLineArguments>`);

  return lines;
}

function buildEnvironmentVariables(
  vars: EnvironmentVariable[],
  depth: number
): string[] {
  const lines: string[] = [];
  const indent = getIndent(depth);

  lines.push(`${indent}<EnvironmentVariables>`);

  for (const v of vars) {
    lines.push(`${getIndent(depth + 1)}<EnvironmentVariable`);
    lines.push(`${getIndent(depth + 1)}   key = "${escapeXml(v.key)}"`);
    lines.push(`${getIndent(depth + 1)}   value = "${escapeXml(v.value)}"`);
    if (v.isEnabled !== undefined) {
      lines.push(
        `${getIndent(depth + 1)}   isEnabled = "${boolToString(v.isEnabled)}">`
      );
    } else {
      lines[lines.length - 1] += ">";
    }
    lines.push(`${getIndent(depth + 1)}</EnvironmentVariable>`);
  }

  lines.push(`${indent}</EnvironmentVariables>`);

  return lines;
}

// ============================================================================
// Helper functions
// ============================================================================

function getIndent(depth: number): string {
  return "   ".repeat(depth);
}

function boolToString(value: boolean): string {
  return value ? "YES" : "NO";
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
