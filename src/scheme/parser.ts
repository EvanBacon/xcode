/**
 * Parser for Xcode scheme files (.xcscheme)
 *
 * Uses @xmldom/xmldom to parse XML into TypeScript objects.
 */
import { DOMParser } from "@xmldom/xmldom";

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
  SkippedTest,
  SelectedTest,
} from "./types";

/**
 * Parse an xcscheme XML string into a typed XCScheme object.
 */
export function parse(xml: string): XCScheme {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");
  const schemeEl = doc.documentElement;

  if (!schemeEl || schemeEl.tagName !== "Scheme") {
    throw new Error("Invalid xcscheme file: root element must be <Scheme>");
  }

  return parseScheme(schemeEl);
}

function parseScheme(el: Element): XCScheme {
  const scheme: XCScheme = {};

  scheme.version = getAttr(el, "version");
  scheme.lastUpgradeVersion = getAttr(el, "LastUpgradeVersion");

  const buildActionEl = getChildElement(el, "BuildAction");
  if (buildActionEl) {
    scheme.buildAction = parseBuildAction(buildActionEl);
  }

  const testActionEl = getChildElement(el, "TestAction");
  if (testActionEl) {
    scheme.testAction = parseTestAction(testActionEl);
  }

  const launchActionEl = getChildElement(el, "LaunchAction");
  if (launchActionEl) {
    scheme.launchAction = parseLaunchAction(launchActionEl);
  }

  const profileActionEl = getChildElement(el, "ProfileAction");
  if (profileActionEl) {
    scheme.profileAction = parseProfileAction(profileActionEl);
  }

  const analyzeActionEl = getChildElement(el, "AnalyzeAction");
  if (analyzeActionEl) {
    scheme.analyzeAction = parseAnalyzeAction(analyzeActionEl);
  }

  const archiveActionEl = getChildElement(el, "ArchiveAction");
  if (archiveActionEl) {
    scheme.archiveAction = parseArchiveAction(archiveActionEl);
  }

  return scheme;
}

function parseBuildAction(el: Element): BuildAction {
  const action: BuildAction = {};

  action.parallelizeBuildables = getBoolAttr(el, "parallelizeBuildables");
  action.buildImplicitDependencies = getBoolAttr(
    el,
    "buildImplicitDependencies"
  );
  action.runPostActionsOnFailure = getBoolAttr(el, "runPostActionsOnFailure");
  action.buildArchitectures = getAttr(el, "buildArchitectures");

  const entriesEl = getChildElement(el, "BuildActionEntries");
  if (entriesEl) {
    action.entries = getChildElements(entriesEl, "BuildActionEntry").map(
      parseBuildActionEntry
    );
  }

  action.preActions = parseExecutionActions(el, "PreActions");
  action.postActions = parseExecutionActions(el, "PostActions");

  return action;
}

function parseBuildActionEntry(el: Element): BuildActionEntry {
  const entry: BuildActionEntry = {};

  entry.buildForRunning = getBoolAttr(el, "buildForRunning");
  entry.buildForTesting = getBoolAttr(el, "buildForTesting");
  entry.buildForProfiling = getBoolAttr(el, "buildForProfiling");
  entry.buildForArchiving = getBoolAttr(el, "buildForArchiving");
  entry.buildForAnalyzing = getBoolAttr(el, "buildForAnalyzing");

  const refEl = getChildElement(el, "BuildableReference");
  if (refEl) {
    entry.buildableReference = parseBuildableReference(refEl);
  }

  return entry;
}

function parseBuildableReference(el: Element): BuildableReference {
  return {
    buildableIdentifier: getAttr(el, "BuildableIdentifier") || "primary",
    blueprintIdentifier: getAttr(el, "BlueprintIdentifier") || "",
    buildableName: getAttr(el, "BuildableName") || "",
    blueprintName: getAttr(el, "BlueprintName") || "",
    referencedContainer: getAttr(el, "ReferencedContainer") || "",
  };
}

function parseExecutionActions(
  parent: Element,
  containerName: string
): ExecutionAction[] | undefined {
  const containerEl = getChildElement(parent, containerName);
  if (!containerEl) return undefined;

  const actions = getChildElements(containerEl, "ExecutionAction");
  if (actions.length === 0) return undefined;

  return actions.map(parseExecutionAction);
}

function parseExecutionAction(el: Element): ExecutionAction {
  const action: ExecutionAction = {};

  action.actionType = getAttr(el, "ActionType");

  const contentEl = getChildElement(el, "ActionContent");
  if (contentEl) {
    action.actionContent = parseActionContent(contentEl);
  }

  return action;
}

function parseActionContent(el: Element): ActionContent {
  const content: ActionContent = {};

  content.title = getAttr(el, "title");
  content.scriptText = getAttr(el, "scriptText");
  content.shellToInvoke = getAttr(el, "shellToInvoke");

  const envBuildableEl = getChildElement(el, "EnvironmentBuildable");
  if (envBuildableEl) {
    const refEl = getChildElement(envBuildableEl, "BuildableReference");
    if (refEl) {
      content.environmentBuildable = parseBuildableReference(refEl);
    }
  }

  return content;
}

function parseTestAction(el: Element): TestAction {
  const action: TestAction = {};

  action.buildConfiguration = getAttr(el, "buildConfiguration");
  action.selectedDebuggerIdentifier = getAttr(el, "selectedDebuggerIdentifier");
  action.selectedLauncherIdentifier = getAttr(el, "selectedLauncherIdentifier");
  action.shouldUseLaunchSchemeArgsEnv = getBoolAttr(
    el,
    "shouldUseLaunchSchemeArgsEnv"
  );
  action.shouldAutocreateTestPlan = getBoolAttr(el, "shouldAutocreateTestPlan");
  action.preferredScreenCaptureFormat = getAttr(
    el,
    "preferredScreenCaptureFormat"
  );
  action.codeCoverageEnabled = getBoolAttr(el, "codeCoverageEnabled");
  action.onlyGenerateCoverageForSpecifiedTargets = getBoolAttr(
    el,
    "onlyGenerateCoverageForSpecifiedTargets"
  );

  const testablesEl = getChildElement(el, "Testables");
  if (testablesEl) {
    action.testables = getChildElements(testablesEl, "TestableReference").map(
      parseTestableReference
    );
  }

  const testPlansEl = getChildElement(el, "TestPlans");
  if (testPlansEl) {
    action.testPlans = getChildElements(testPlansEl, "TestPlanReference").map(
      parseTestPlanReference
    );
  }

  const macroExpansionEl = getChildElement(el, "MacroExpansion");
  if (macroExpansionEl) {
    const refEl = getChildElement(macroExpansionEl, "BuildableReference");
    if (refEl) {
      action.macroExpansion = parseBuildableReference(refEl);
    }
  }

  action.commandLineArguments = parseCommandLineArguments(el);
  action.environmentVariables = parseEnvironmentVariables(el);
  action.preActions = parseExecutionActions(el, "PreActions");
  action.postActions = parseExecutionActions(el, "PostActions");

  return action;
}

function parseTestableReference(el: Element): TestableReference {
  const ref: TestableReference = {};

  ref.skipped = getBoolAttr(el, "skipped");
  ref.parallelizable = getBoolAttr(el, "parallelizable");
  ref.useTestSelectionWhitelist = getBoolAttr(el, "useTestSelectionWhitelist");

  const buildableRefEl = getChildElement(el, "BuildableReference");
  if (buildableRefEl) {
    ref.buildableReference = parseBuildableReference(buildableRefEl);
  }

  const skippedTestsEl = getChildElement(el, "SkippedTests");
  if (skippedTestsEl) {
    ref.skippedTests = getChildElements(skippedTestsEl, "Test").map(
      (testEl): SkippedTest => ({
        identifier: getAttr(testEl, "Identifier") || "",
      })
    );
  }

  const selectedTestsEl = getChildElement(el, "SelectedTests");
  if (selectedTestsEl) {
    ref.selectedTests = getChildElements(selectedTestsEl, "Test").map(
      (testEl): SelectedTest => ({
        identifier: getAttr(testEl, "Identifier") || "",
      })
    );
  }

  return ref;
}

function parseTestPlanReference(el: Element): TestPlanReference {
  return {
    reference: getAttr(el, "reference") || "",
    default: getBoolAttr(el, "default"),
  };
}

function parseLaunchAction(el: Element): LaunchAction {
  const action: LaunchAction = {};

  action.buildConfiguration = getAttr(el, "buildConfiguration");
  action.selectedDebuggerIdentifier = getAttr(el, "selectedDebuggerIdentifier");
  action.selectedLauncherIdentifier = getAttr(el, "selectedLauncherIdentifier");
  action.launchStyle = getAttr(el, "launchStyle");
  action.useCustomWorkingDirectory = getBoolAttr(
    el,
    "useCustomWorkingDirectory"
  );
  action.customWorkingDirectory = getAttr(el, "customWorkingDirectory");
  action.ignoresPersistentStateOnLaunch = getBoolAttr(
    el,
    "ignoresPersistentStateOnLaunch"
  );
  action.debugDocumentVersioning = getBoolAttr(el, "debugDocumentVersioning");
  action.debugServiceExtension = getAttr(el, "debugServiceExtension");
  action.allowLocationSimulation = getBoolAttr(el, "allowLocationSimulation");
  action.customLaunchCommand = getAttr(el, "customLaunchCommand");
  action.appClipInvocationURLString = getAttr(el, "appClipInvocationURLString");
  action.askForAppToLaunch = getBoolAttr(el, "askForAppToLaunch");
  action.launchAutomaticallySubstyle = getAttr(
    el,
    "launchAutomaticallySubstyle"
  );

  const runnableEl = getChildElement(el, "BuildableProductRunnable");
  if (runnableEl) {
    action.buildableProductRunnable = parseBuildableProductRunnable(runnableEl);
  }

  const remoteRunnableEl = getChildElement(el, "RemoteRunnable");
  if (remoteRunnableEl) {
    action.remoteRunnable = parseRemoteRunnable(remoteRunnableEl);
  }

  const macroExpansionEl = getChildElement(el, "MacroExpansion");
  if (macroExpansionEl) {
    const refEl = getChildElement(macroExpansionEl, "BuildableReference");
    if (refEl) {
      action.macroExpansion = parseBuildableReference(refEl);
    }
  }

  const locationEl = getChildElement(el, "LocationScenarioReference");
  if (locationEl) {
    action.locationScenarioReference = parseLocationScenarioReference(
      locationEl
    );
  }

  const storeKitEl = getChildElement(el, "StoreKitConfigurationFileReference");
  if (storeKitEl) {
    action.storeKitConfigurationFileReference =
      parseStoreKitConfigurationFileReference(storeKitEl);
  }

  action.commandLineArguments = parseCommandLineArguments(el);
  action.environmentVariables = parseEnvironmentVariables(el);
  action.preActions = parseExecutionActions(el, "PreActions");
  action.postActions = parseExecutionActions(el, "PostActions");

  return action;
}

function parseBuildableProductRunnable(el: Element): BuildableProductRunnable {
  const runnable: BuildableProductRunnable = {};

  runnable.runnableDebuggingMode = getAttr(el, "runnableDebuggingMode");

  const refEl = getChildElement(el, "BuildableReference");
  if (refEl) {
    runnable.buildableReference = parseBuildableReference(refEl);
  }

  return runnable;
}

function parseRemoteRunnable(el: Element): RemoteRunnable {
  const runnable: RemoteRunnable = {};

  runnable.runnableDebuggingMode = getAttr(el, "runnableDebuggingMode");
  runnable.bundleIdentifier = getAttr(el, "BundleIdentifier");
  runnable.remotePath = getAttr(el, "RemotePath");

  const refEl = getChildElement(el, "BuildableReference");
  if (refEl) {
    runnable.buildableReference = parseBuildableReference(refEl);
  }

  return runnable;
}

function parseLocationScenarioReference(el: Element): LocationScenarioReference {
  return {
    identifier: getAttr(el, "identifier"),
    referenceType: getAttr(el, "referenceType"),
  };
}

function parseStoreKitConfigurationFileReference(
  el: Element
): StoreKitConfigurationFileReference {
  return {
    identifier: getAttr(el, "identifier"),
  };
}

function parseProfileAction(el: Element): ProfileAction {
  const action: ProfileAction = {};

  action.buildConfiguration = getAttr(el, "buildConfiguration");
  action.shouldUseLaunchSchemeArgsEnv = getBoolAttr(
    el,
    "shouldUseLaunchSchemeArgsEnv"
  );
  action.savedToolIdentifier = getAttr(el, "savedToolIdentifier");
  action.useCustomWorkingDirectory = getBoolAttr(
    el,
    "useCustomWorkingDirectory"
  );
  action.debugDocumentVersioning = getBoolAttr(el, "debugDocumentVersioning");
  action.askForAppToLaunch = getBoolAttr(el, "askForAppToLaunch");
  action.launchAutomaticallySubstyle = getAttr(
    el,
    "launchAutomaticallySubstyle"
  );
  action.appClipInvocationURLString = getAttr(el, "appClipInvocationURLString");

  const runnableEl = getChildElement(el, "BuildableProductRunnable");
  if (runnableEl) {
    action.buildableProductRunnable = parseBuildableProductRunnable(runnableEl);
  }

  action.commandLineArguments = parseCommandLineArguments(el);
  action.environmentVariables = parseEnvironmentVariables(el);
  action.preActions = parseExecutionActions(el, "PreActions");
  action.postActions = parseExecutionActions(el, "PostActions");

  return action;
}

function parseAnalyzeAction(el: Element): AnalyzeAction {
  const action: AnalyzeAction = {};

  action.buildConfiguration = getAttr(el, "buildConfiguration");
  action.preActions = parseExecutionActions(el, "PreActions");
  action.postActions = parseExecutionActions(el, "PostActions");

  return action;
}

function parseArchiveAction(el: Element): ArchiveAction {
  const action: ArchiveAction = {};

  action.buildConfiguration = getAttr(el, "buildConfiguration");
  action.customArchiveName = getAttr(el, "customArchiveName");
  action.revealArchiveInOrganizer = getBoolAttr(el, "revealArchiveInOrganizer");
  action.preActions = parseExecutionActions(el, "PreActions");
  action.postActions = parseExecutionActions(el, "PostActions");

  return action;
}

function parseCommandLineArguments(
  el: Element
): CommandLineArgument[] | undefined {
  const argsEl = getChildElement(el, "CommandLineArguments");
  if (!argsEl) return undefined;

  const args = getChildElements(argsEl, "CommandLineArgument");
  if (args.length === 0) return undefined;

  return args.map(
    (argEl): CommandLineArgument => ({
      argument: getAttr(argEl, "argument") || "",
      isEnabled: getBoolAttr(argEl, "isEnabled"),
    })
  );
}

function parseEnvironmentVariables(
  el: Element
): EnvironmentVariable[] | undefined {
  const varsEl = getChildElement(el, "EnvironmentVariables");
  if (!varsEl) return undefined;

  const vars = getChildElements(varsEl, "EnvironmentVariable");
  if (vars.length === 0) return undefined;

  return vars.map(
    (varEl): EnvironmentVariable => ({
      key: getAttr(varEl, "key") || "",
      value: getAttr(varEl, "value") || "",
      isEnabled: getBoolAttr(varEl, "isEnabled"),
    })
  );
}

// ============================================================================
// Helper functions
// ============================================================================

function getAttr(el: Element, name: string): string | undefined {
  if (!el.hasAttribute(name)) return undefined;
  return el.getAttribute(name) ?? undefined;
}

function getBoolAttr(el: Element, name: string): boolean | undefined {
  const value = el.getAttribute(name);
  if (value === "YES" || value === "Yes") return true;
  if (value === "NO" || value === "No") return false;
  return undefined;
}

function getChildElement(parent: Element, tagName: string): Element | null {
  const children = parent.childNodes;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.nodeType === 1 && (child as Element).tagName === tagName) {
      return child as Element;
    }
  }
  return null;
}

function getChildElements(parent: Element, tagName: string): Element[] {
  const results: Element[] = [];
  const children = parent.childNodes;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.nodeType === 1 && (child as Element).tagName === tagName) {
      results.push(child as Element);
    }
  }
  return results;
}
