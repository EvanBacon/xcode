/**
 * TypeScript definitions for Xcode breakpoint list files (Breakpoints_v2.xcbkptlist)
 *
 * These XML files store shared breakpoints in xcshareddata directories.
 */

/** Root breakpoint list container */
export interface XCBreakpointList {
  /** UUID for the breakpoint bucket */
  uuid?: string;
  /** Bucket type (usually "1") */
  type?: string;
  /** Format version (e.g., "2.0") */
  version?: string;
  /** List of breakpoint proxies */
  breakpoints?: BreakpointProxy[];
}

/** Wrapper for a single breakpoint */
export interface BreakpointProxy {
  /** Extension ID identifying the breakpoint type */
  breakpointExtensionID: BreakpointType;
  /** The actual breakpoint content */
  breakpointContent?: BreakpointContent;
}

/** Breakpoint type identifiers */
export type BreakpointType =
  | "Xcode.Breakpoint.FileBreakpoint"
  | "Xcode.Breakpoint.SymbolicBreakpoint"
  | "Xcode.Breakpoint.ExceptionBreakpoint"
  | "Xcode.Breakpoint.SwiftErrorBreakpoint"
  | "Xcode.Breakpoint.OpenGLErrorBreakpoint"
  | "Xcode.Breakpoint.IDETestFailureBreakpoint"
  | "Xcode.Breakpoint.RuntimeIssueBreakpoint"
  | "Xcode.Breakpoint.ConstraintErrorBreakpoint"
  | string; // Allow custom breakpoint types

/** Detailed breakpoint configuration */
export interface BreakpointContent {
  /** Unique identifier for this breakpoint */
  uuid?: string;
  /** Whether the breakpoint is enabled */
  shouldBeEnabled?: boolean;
  /** Number of times to ignore before breaking */
  ignoreCount?: number;
  /** Whether to continue after running actions */
  continueAfterRunningActions?: boolean;
  /** File path (for file breakpoints) */
  filePath?: string;
  /** Starting column number */
  startingColumnNumber?: string;
  /** Ending column number */
  endingColumnNumber?: string;
  /** Starting line number */
  startingLineNumber?: string;
  /** Ending line number */
  endingLineNumber?: string;
  /** Name of the function/method containing the breakpoint */
  landmarkName?: string;
  /** Type of landmark (7 = method, 9 = function) */
  landmarkType?: string;
  /** Condition expression */
  condition?: string;
  /** Scope (for symbolic breakpoints) */
  scope?: string;
  /** Symbol name (for symbolic breakpoints) */
  symbolName?: string;
  /** Module name (for symbolic breakpoints) */
  moduleName?: string;
  /** Exception type (for exception breakpoints): "0" = Objective-C, "1" = C++ */
  exceptionType?: string;
  /** Stop on style: "0" = throw, "1" = catch */
  stopOnStyle?: string;
  /** Breakpoint actions */
  actions?: BreakpointActionProxy[];
  /** Locations for resolved breakpoints */
  locations?: BreakpointLocation[];
}

/** Wrapper for a breakpoint action */
export interface BreakpointActionProxy {
  /** Action type identifier */
  actionExtensionID: BreakpointActionType;
  /** Action content */
  actionContent?: BreakpointActionContent;
}

/** Action type identifiers */
export type BreakpointActionType =
  | "Xcode.BreakpointAction.DebuggerCommand"
  | "Xcode.BreakpointAction.Log"
  | "Xcode.BreakpointAction.ShellCommand"
  | "Xcode.BreakpointAction.Sound"
  | "Xcode.BreakpointAction.AppleScript"
  | "Xcode.BreakpointAction.GraphicsTrace"
  | string; // Allow custom action types

/** Action content details */
export interface BreakpointActionContent {
  /** Debugger command to execute */
  consoleCommand?: string;
  /** Message to log */
  message?: string;
  /** Whether to speak the log message */
  conveyanceType?: string;
  /** Shell command path */
  shellCommand?: string;
  /** Arguments for shell command */
  shellArguments?: string;
  /** Wait until done before continuing */
  waitUntilDone?: boolean;
  /** AppleScript text */
  script?: string;
  /** Sound name */
  soundName?: string;
}

/** Location where breakpoint is resolved */
export interface BreakpointLocation {
  /** UUID for this location */
  uuid?: string;
  /** Whether this location should be enabled */
  shouldBeEnabled?: boolean;
  /** Ignore count for this location */
  ignoreCount?: number;
  /** Continue after running actions */
  continueAfterRunningActions?: boolean;
  /** Symbol name at this location */
  symbolName?: string;
  /** Module name at this location */
  moduleName?: string;
  /** URL path */
  urlString?: string;
  /** Starting line number */
  startingLineNumber?: string;
  /** Ending line number */
  endingLineNumber?: string;
  /** Starting column number */
  startingColumnNumber?: string;
  /** Ending column number */
  endingColumnNumber?: string;
}
