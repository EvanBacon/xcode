/**
 * Writer for Xcode breakpoint list files (Breakpoints_v2.xcbkptlist)
 *
 * Serializes TypeScript objects back to XML format.
 */
import type {
  XCBreakpointList,
  BreakpointProxy,
  BreakpointContent,
  BreakpointActionProxy,
  BreakpointActionContent,
  BreakpointLocation,
} from "./types";

/**
 * Build a breakpoint list XML string from a typed XCBreakpointList object.
 */
export function build(list: XCBreakpointList): string {
  const lines: string[] = [];

  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push("<Bucket");

  const bucketAttrs = buildBucketAttributes(list);
  lines.push(...bucketAttrs.map((a) => `   ${a}`));
  lines[lines.length - 1] += ">";

  if (list.breakpoints && list.breakpoints.length > 0) {
    lines.push(`${getIndent(1)}<Breakpoints>`);
    for (const bp of list.breakpoints) {
      lines.push(...buildBreakpointProxy(bp, 2));
    }
    lines.push(`${getIndent(1)}</Breakpoints>`);
  }

  lines.push("</Bucket>");

  return lines.join("\n") + "\n";
}

function buildBucketAttributes(list: XCBreakpointList): string[] {
  const attrs: string[] = [];

  if (list.uuid !== undefined) {
    attrs.push(`uuid = "${list.uuid}"`);
  }
  if (list.type !== undefined) {
    attrs.push(`type = "${list.type}"`);
  }
  if (list.version !== undefined) {
    attrs.push(`version = "${list.version}"`);
  }

  return attrs;
}

function buildBreakpointProxy(proxy: BreakpointProxy, depth: number): string[] {
  const lines: string[] = [];
  const indent = getIndent(depth);

  lines.push(`${indent}<BreakpointProxy`);
  lines.push(
    `${indent}   BreakpointExtensionID = "${proxy.breakpointExtensionID}">`
  );

  if (proxy.breakpointContent) {
    lines.push(...buildBreakpointContent(proxy.breakpointContent, depth + 1));
  }

  lines.push(`${indent}</BreakpointProxy>`);

  return lines;
}

function buildBreakpointContent(
  content: BreakpointContent,
  depth: number
): string[] {
  const lines: string[] = [];
  const indent = getIndent(depth);
  const attrs: string[] = [];

  if (content.uuid !== undefined) {
    attrs.push(`uuid = "${content.uuid}"`);
  }
  if (content.shouldBeEnabled !== undefined) {
    attrs.push(`shouldBeEnabled = "${boolToString(content.shouldBeEnabled)}"`);
  }
  if (content.ignoreCount !== undefined) {
    attrs.push(`ignoreCount = "${content.ignoreCount}"`);
  }
  if (content.continueAfterRunningActions !== undefined) {
    attrs.push(
      `continueAfterRunningActions = "${boolToString(
        content.continueAfterRunningActions
      )}"`
    );
  }
  if (content.filePath !== undefined) {
    attrs.push(`filePath = "${escapeXml(content.filePath)}"`);
  }
  if (content.startingColumnNumber !== undefined) {
    attrs.push(`startingColumnNumber = "${content.startingColumnNumber}"`);
  }
  if (content.endingColumnNumber !== undefined) {
    attrs.push(`endingColumnNumber = "${content.endingColumnNumber}"`);
  }
  if (content.startingLineNumber !== undefined) {
    attrs.push(`startingLineNumber = "${content.startingLineNumber}"`);
  }
  if (content.endingLineNumber !== undefined) {
    attrs.push(`endingLineNumber = "${content.endingLineNumber}"`);
  }
  if (content.landmarkName !== undefined) {
    attrs.push(`landmarkName = "${escapeXml(content.landmarkName)}"`);
  }
  if (content.landmarkType !== undefined) {
    attrs.push(`landmarkType = "${content.landmarkType}"`);
  }
  if (content.condition !== undefined) {
    attrs.push(`condition = "${escapeXml(content.condition)}"`);
  }
  if (content.scope !== undefined) {
    attrs.push(`scope = "${content.scope}"`);
  }
  if (content.symbolName !== undefined) {
    attrs.push(`symbolName = "${escapeXml(content.symbolName)}"`);
  }
  if (content.moduleName !== undefined) {
    attrs.push(`moduleName = "${escapeXml(content.moduleName)}"`);
  }
  if (content.exceptionType !== undefined) {
    attrs.push(`exceptionType = "${content.exceptionType}"`);
  }
  if (content.stopOnStyle !== undefined) {
    attrs.push(`stopOnStyle = "${content.stopOnStyle}"`);
  }

  lines.push(`${indent}<BreakpointContent`);
  for (const attr of attrs) {
    lines.push(`${indent}   ${attr}`);
  }

  const hasChildren =
    (content.actions && content.actions.length > 0) ||
    (content.locations && content.locations.length > 0);

  if (hasChildren) {
    lines[lines.length - 1] += ">";

    if (content.actions && content.actions.length > 0) {
      lines.push(`${getIndent(depth + 1)}<Actions>`);
      for (const action of content.actions) {
        lines.push(...buildBreakpointActionProxy(action, depth + 2));
      }
      lines.push(`${getIndent(depth + 1)}</Actions>`);
    }

    if (content.locations && content.locations.length > 0) {
      lines.push(`${getIndent(depth + 1)}<Locations>`);
      for (const loc of content.locations) {
        lines.push(...buildBreakpointLocation(loc, depth + 2));
      }
      lines.push(`${getIndent(depth + 1)}</Locations>`);
    }

    lines.push(`${indent}</BreakpointContent>`);
  } else {
    lines[lines.length - 1] += ">";
    lines.push(`${indent}</BreakpointContent>`);
  }

  return lines;
}

function buildBreakpointActionProxy(
  proxy: BreakpointActionProxy,
  depth: number
): string[] {
  const lines: string[] = [];
  const indent = getIndent(depth);

  lines.push(`${indent}<BreakpointActionProxy`);
  lines.push(`${indent}   ActionExtensionID = "${proxy.actionExtensionID}">`);

  if (proxy.actionContent) {
    lines.push(...buildBreakpointActionContent(proxy.actionContent, depth + 1));
  }

  lines.push(`${indent}</BreakpointActionProxy>`);

  return lines;
}

function buildBreakpointActionContent(
  content: BreakpointActionContent,
  depth: number
): string[] {
  const lines: string[] = [];
  const indent = getIndent(depth);
  const attrs: string[] = [];

  if (content.consoleCommand !== undefined) {
    attrs.push(`consoleCommand = "${escapeXml(content.consoleCommand)}"`);
  }
  if (content.message !== undefined) {
    attrs.push(`message = "${escapeXml(content.message)}"`);
  }
  if (content.conveyanceType !== undefined) {
    attrs.push(`conveyanceType = "${content.conveyanceType}"`);
  }
  if (content.shellCommand !== undefined) {
    attrs.push(`shellCommand = "${escapeXml(content.shellCommand)}"`);
  }
  if (content.shellArguments !== undefined) {
    attrs.push(`shellArguments = "${escapeXml(content.shellArguments)}"`);
  }
  if (content.waitUntilDone !== undefined) {
    attrs.push(`waitUntilDone = "${boolToString(content.waitUntilDone)}"`);
  }
  if (content.script !== undefined) {
    attrs.push(`script = "${escapeXml(content.script)}"`);
  }
  if (content.soundName !== undefined) {
    attrs.push(`soundName = "${escapeXml(content.soundName)}"`);
  }

  lines.push(`${indent}<ActionContent`);
  for (const attr of attrs) {
    lines.push(`${indent}   ${attr}`);
  }
  lines[lines.length - 1] += ">";
  lines.push(`${indent}</ActionContent>`);

  return lines;
}

function buildBreakpointLocation(
  location: BreakpointLocation,
  depth: number
): string[] {
  const lines: string[] = [];
  const indent = getIndent(depth);
  const attrs: string[] = [];

  if (location.uuid !== undefined) {
    attrs.push(`uuid = "${location.uuid}"`);
  }
  if (location.shouldBeEnabled !== undefined) {
    attrs.push(
      `shouldBeEnabled = "${boolToString(location.shouldBeEnabled)}"`
    );
  }
  if (location.ignoreCount !== undefined) {
    attrs.push(`ignoreCount = "${location.ignoreCount}"`);
  }
  if (location.continueAfterRunningActions !== undefined) {
    attrs.push(
      `continueAfterRunningActions = "${boolToString(
        location.continueAfterRunningActions
      )}"`
    );
  }
  if (location.symbolName !== undefined) {
    attrs.push(`symbolName = "${escapeXml(location.symbolName)}"`);
  }
  if (location.moduleName !== undefined) {
    attrs.push(`moduleName = "${escapeXml(location.moduleName)}"`);
  }
  if (location.urlString !== undefined) {
    attrs.push(`urlString = "${escapeXml(location.urlString)}"`);
  }
  if (location.startingLineNumber !== undefined) {
    attrs.push(`startingLineNumber = "${location.startingLineNumber}"`);
  }
  if (location.endingLineNumber !== undefined) {
    attrs.push(`endingLineNumber = "${location.endingLineNumber}"`);
  }
  if (location.startingColumnNumber !== undefined) {
    attrs.push(`startingColumnNumber = "${location.startingColumnNumber}"`);
  }
  if (location.endingColumnNumber !== undefined) {
    attrs.push(`endingColumnNumber = "${location.endingColumnNumber}"`);
  }

  lines.push(`${indent}<BreakpointLocationProxy>`);
  lines.push(`${getIndent(depth + 1)}<BreakpointLocationContent`);
  for (const attr of attrs) {
    lines.push(`${getIndent(depth + 1)}   ${attr}`);
  }
  lines[lines.length - 1] += ">";
  lines.push(`${getIndent(depth + 1)}</BreakpointLocationContent>`);
  lines.push(`${indent}</BreakpointLocationProxy>`);

  return lines;
}

// ============================================================================
// Helper functions
// ============================================================================

function getIndent(depth: number): string {
  return "   ".repeat(depth);
}

function boolToString(value: boolean): string {
  return value ? "Yes" : "No";
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
