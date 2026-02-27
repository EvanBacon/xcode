/**
 * TypeScript definitions for Xcode scheme files (.xcscheme)
 *
 * XCScheme files are XML documents that define how targets are built, run,
 * tested, profiled, analyzed, and archived in Xcode.
 */

/** Root scheme object */
export interface XCScheme {
  /** Scheme version, e.g., "1.3", "1.7", "2.0" */
  version?: string;
  /** Last Xcode version that upgraded the scheme, e.g., "0830", "1300" */
  lastUpgradeVersion?: string;
  /** Build action configuration */
  buildAction?: BuildAction;
  /** Test action configuration */
  testAction?: TestAction;
  /** Launch/run action configuration */
  launchAction?: LaunchAction;
  /** Profile (Instruments) action configuration */
  profileAction?: ProfileAction;
  /** Analyze action configuration */
  analyzeAction?: AnalyzeAction;
  /** Archive action configuration */
  archiveAction?: ArchiveAction;
}

/**
 * Reference to a buildable target.
 * Links scheme actions to specific targets in a project.
 */
export interface BuildableReference {
  /** Usually "primary" */
  buildableIdentifier: string;
  /** UUID linking to PBXNativeTarget in the project file */
  blueprintIdentifier: string;
  /** The product name, e.g., "App.app", "AppTests.xctest" */
  buildableName: string;
  /** Target name in the project */
  blueprintName: string;
  /** Container reference, e.g., "container:Project.xcodeproj" */
  referencedContainer: string;
}

/**
 * Build action configuration.
 * Defines what targets are built and in what configuration.
 */
export interface BuildAction {
  /** Whether to build targets in parallel */
  parallelizeBuildables?: boolean;
  /** Whether to build implicit dependencies */
  buildImplicitDependencies?: boolean;
  /** Whether to run post actions even on build failure */
  runPostActionsOnFailure?: boolean;
  /** Build architectures setting: "Automatic", "Native", "Standard" */
  buildArchitectures?: string;
  /** List of targets to build */
  entries?: BuildActionEntry[];
  /** Scripts to run before build */
  preActions?: ExecutionAction[];
  /** Scripts to run after build */
  postActions?: ExecutionAction[];
}

/**
 * Entry in the build action specifying a target and build configurations.
 */
export interface BuildActionEntry {
  /** Build this target for running */
  buildForRunning?: boolean;
  /** Build this target for testing */
  buildForTesting?: boolean;
  /** Build this target for profiling */
  buildForProfiling?: boolean;
  /** Build this target for archiving */
  buildForArchiving?: boolean;
  /** Build this target for analyzing */
  buildForAnalyzing?: boolean;
  /** Reference to the target */
  buildableReference?: BuildableReference;
}

/**
 * Execution action (pre/post action script).
 */
export interface ExecutionAction {
  /** Action type, usually "Xcode.IDEStandardExecutionActionsCore.ExecutionActionType.ShellScriptAction" */
  actionType?: string;
  /** Action content with script details */
  actionContent?: ActionContent;
}

/**
 * Content of an execution action.
 */
export interface ActionContent {
  /** Display title for the action */
  title?: string;
  /** Shell script text to execute */
  scriptText?: string;
  /** Shell to invoke, e.g., "/bin/sh" */
  shellToInvoke?: string;
  /** Target to use for build settings in script environment */
  environmentBuildable?: BuildableReference;
}

/**
 * Test action configuration.
 */
export interface TestAction {
  /** Build configuration to use, e.g., "Debug" */
  buildConfiguration?: string;
  /** Debugger identifier */
  selectedDebuggerIdentifier?: string;
  /** Launcher identifier */
  selectedLauncherIdentifier?: string;
  /** Whether to use launch scheme args/env */
  shouldUseLaunchSchemeArgsEnv?: boolean;
  /** Whether to auto-create test plan */
  shouldAutocreateTestPlan?: boolean;
  /** Preferred screen capture format: "screenshots" or "screenRecordings" */
  preferredScreenCaptureFormat?: string;
  /** Enable code coverage */
  codeCoverageEnabled?: boolean;
  /** Only generate coverage for specified targets */
  onlyGenerateCoverageForSpecifiedTargets?: boolean;
  /** Test targets */
  testables?: TestableReference[];
  /** Test plans */
  testPlans?: TestPlanReference[];
  /** Target for macro expansion */
  macroExpansion?: BuildableReference;
  /** Command line arguments */
  commandLineArguments?: CommandLineArgument[];
  /** Environment variables */
  environmentVariables?: EnvironmentVariable[];
  /** Scripts to run before testing */
  preActions?: ExecutionAction[];
  /** Scripts to run after testing */
  postActions?: ExecutionAction[];
}

/**
 * Reference to a test target.
 */
export interface TestableReference {
  /** Whether this testable is skipped */
  skipped?: boolean;
  /** Parallelizable flag */
  parallelizable?: boolean;
  /** Use test selection whitelist */
  useTestSelectionWhitelist?: boolean;
  /** Reference to the test target */
  buildableReference?: BuildableReference;
  /** Skipped tests */
  skippedTests?: SkippedTest[];
  /** Selected tests */
  selectedTests?: SelectedTest[];
}

/** Skipped test identifier */
export interface SkippedTest {
  identifier: string;
}

/** Selected test identifier */
export interface SelectedTest {
  identifier: string;
}

/**
 * Reference to a test plan.
 */
export interface TestPlanReference {
  /** Reference path, e.g., "container:iOS.xctestplan" */
  reference: string;
  /** Whether this is the default test plan */
  default?: boolean;
}

/**
 * Launch action configuration.
 */
export interface LaunchAction {
  /** Build configuration to use */
  buildConfiguration?: string;
  /** Debugger identifier */
  selectedDebuggerIdentifier?: string;
  /** Launcher identifier */
  selectedLauncherIdentifier?: string;
  /** Launch style: "0" = auto, "1" = wait for launch, "2" = custom */
  launchStyle?: string;
  /** Whether to use custom working directory */
  useCustomWorkingDirectory?: boolean;
  /** Custom working directory path */
  customWorkingDirectory?: string;
  /** Ignore persistent state on launch */
  ignoresPersistentStateOnLaunch?: boolean;
  /** Debug document versioning */
  debugDocumentVersioning?: boolean;
  /** Debug service extension */
  debugServiceExtension?: string;
  /** Allow location simulation */
  allowLocationSimulation?: boolean;
  /** Custom launch command */
  customLaunchCommand?: string;
  /** App clip invocation URL */
  appClipInvocationURLString?: string;
  /** Ask for app to launch */
  askForAppToLaunch?: boolean;
  /** Launch automatically substyle: "2" = watch extension */
  launchAutomaticallySubstyle?: string;
  /** Runnable target */
  buildableProductRunnable?: BuildableProductRunnable;
  /** Remote runnable for device testing */
  remoteRunnable?: RemoteRunnable;
  /** Target for macro expansion */
  macroExpansion?: BuildableReference;
  /** Location scenario reference */
  locationScenarioReference?: LocationScenarioReference;
  /** StoreKit configuration file reference */
  storeKitConfigurationFileReference?: StoreKitConfigurationFileReference;
  /** Command line arguments */
  commandLineArguments?: CommandLineArgument[];
  /** Environment variables */
  environmentVariables?: EnvironmentVariable[];
  /** Scripts to run before launch */
  preActions?: ExecutionAction[];
  /** Scripts to run after launch */
  postActions?: ExecutionAction[];
}

/**
 * Runnable product reference.
 */
export interface BuildableProductRunnable {
  /** Debugging mode: "0" = normal, "1" = remote */
  runnableDebuggingMode?: string;
  /** Reference to the buildable target */
  buildableReference?: BuildableReference;
}

/**
 * Remote runnable for device testing without build.
 */
export interface RemoteRunnable {
  /** Debugging mode */
  runnableDebuggingMode?: string;
  /** Bundle identifier of the app */
  bundleIdentifier?: string;
  /** Remote path to the app on device */
  remotePath?: string;
  /** Reference to the buildable target */
  buildableReference?: BuildableReference;
}

/**
 * Location scenario reference for location simulation.
 */
export interface LocationScenarioReference {
  /** Scenario identifier */
  identifier?: string;
  /** Reference type */
  referenceType?: string;
}

/**
 * StoreKit configuration file reference.
 */
export interface StoreKitConfigurationFileReference {
  /** Path to StoreKit configuration file */
  identifier?: string;
}

/**
 * Profile action configuration.
 */
export interface ProfileAction {
  /** Build configuration to use, typically "Release" */
  buildConfiguration?: string;
  /** Whether to use launch scheme args/env */
  shouldUseLaunchSchemeArgsEnv?: boolean;
  /** Saved tool identifier */
  savedToolIdentifier?: string;
  /** Whether to use custom working directory */
  useCustomWorkingDirectory?: boolean;
  /** Debug document versioning */
  debugDocumentVersioning?: boolean;
  /** Ask for app to launch */
  askForAppToLaunch?: boolean;
  /** Launch automatically substyle */
  launchAutomaticallySubstyle?: string;
  /** App clip invocation URL */
  appClipInvocationURLString?: string;
  /** Runnable target */
  buildableProductRunnable?: BuildableProductRunnable;
  /** Command line arguments */
  commandLineArguments?: CommandLineArgument[];
  /** Environment variables */
  environmentVariables?: EnvironmentVariable[];
  /** Scripts to run before profiling */
  preActions?: ExecutionAction[];
  /** Scripts to run after profiling */
  postActions?: ExecutionAction[];
}

/**
 * Analyze action configuration.
 */
export interface AnalyzeAction {
  /** Build configuration to use */
  buildConfiguration?: string;
  /** Scripts to run before analyzing */
  preActions?: ExecutionAction[];
  /** Scripts to run after analyzing */
  postActions?: ExecutionAction[];
}

/**
 * Archive action configuration.
 */
export interface ArchiveAction {
  /** Build configuration to use, typically "Release" */
  buildConfiguration?: string;
  /** Custom archive name */
  customArchiveName?: string;
  /** Reveal archive in Organizer after archiving */
  revealArchiveInOrganizer?: boolean;
  /** Scripts to run before archiving */
  preActions?: ExecutionAction[];
  /** Scripts to run after archiving */
  postActions?: ExecutionAction[];
}

/**
 * Command line argument for launch/test actions.
 */
export interface CommandLineArgument {
  /** The argument string */
  argument: string;
  /** Whether this argument is enabled */
  isEnabled?: boolean;
}

/**
 * Environment variable for launch/test actions.
 */
export interface EnvironmentVariable {
  /** Variable name */
  key: string;
  /** Variable value */
  value: string;
  /** Whether this variable is enabled */
  isEnabled?: boolean;
}

// ============================================================================
// XCSchemeManagement types (xcschememanagement.plist)
// ============================================================================

/**
 * Root object for xcschememanagement.plist files.
 * Manages scheme visibility and ordering in Xcode.
 */
export interface XCSchemeManagement {
  /** State for each scheme (visibility and order) */
  SchemeUserState?: Record<string, SchemeUserState>;
  /** Suppress automatic scheme creation for targets */
  SuppressBuildableAutocreation?: Record<string, SuppressBuildableAutocreation>;
}

/**
 * User state for a scheme.
 */
export interface SchemeUserState {
  /** Whether the scheme is shown in the scheme selector */
  isShown?: boolean;
  /** Order hint for sorting schemes */
  orderHint?: number;
}

/**
 * Settings to suppress automatic scheme creation for a target.
 */
export interface SuppressBuildableAutocreation {
  /** Whether to suppress primary scheme autocreation */
  primary?: boolean;
}
