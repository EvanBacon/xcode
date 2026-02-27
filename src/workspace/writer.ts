/**
 * Writer for Xcode workspace files (contents.xcworkspacedata)
 *
 * Serializes TypeScript objects back to XML format.
 */
import type { XCWorkspace, FileRef, Group } from "./types";

/**
 * Build an xcworkspacedata XML string from a typed XCWorkspace object.
 */
export function build(workspace: XCWorkspace): string {
  const lines: string[] = [];

  lines.push('<?xml version="1.0" encoding="UTF-8"?>');

  const attrs: string[] = [];
  if (workspace.version !== undefined) {
    attrs.push(`version = "${workspace.version}"`);
  }

  if (attrs.length > 0) {
    lines.push("<Workspace");
    for (const attr of attrs) {
      lines.push(`   ${attr}`);
    }
    lines[lines.length - 1] += ">";
  } else {
    lines.push("<Workspace>");
  }

  // Build file references
  if (workspace.fileRefs) {
    for (const fileRef of workspace.fileRefs) {
      lines.push(...buildFileRef(fileRef, 1));
    }
  }

  // Build groups
  if (workspace.groups) {
    for (const group of workspace.groups) {
      lines.push(...buildGroup(group, 1));
    }
  }

  lines.push("</Workspace>");

  return lines.join("\n") + "\n";
}

function buildFileRef(fileRef: FileRef, depth: number): string[] {
  const indent = getIndent(depth);
  return [`${indent}<FileRef`
    + `\n${indent}   location = "${escapeXml(fileRef.location)}">`
    + `\n${indent}</FileRef>`];
}

function buildGroup(group: Group, depth: number): string[] {
  const lines: string[] = [];
  const indent = getIndent(depth);
  const attrs: string[] = [];

  if (group.location !== undefined) {
    attrs.push(`location = "${escapeXml(group.location)}"`);
  }
  if (group.name !== undefined) {
    attrs.push(`name = "${escapeXml(group.name)}"`);
  }

  lines.push(`${indent}<Group`);
  for (const attr of attrs) {
    lines.push(`${indent}   ${attr}`);
  }
  lines[lines.length - 1] += ">";

  // Build file references within group
  if (group.fileRefs) {
    for (const fileRef of group.fileRefs) {
      lines.push(...buildFileRef(fileRef, depth + 1));
    }
  }

  // Build nested groups
  if (group.groups) {
    for (const nestedGroup of group.groups) {
      lines.push(...buildGroup(nestedGroup, depth + 1));
    }
  }

  lines.push(`${indent}</Group>`);

  return lines;
}

// ============================================================================
// Helper functions
// ============================================================================

function getIndent(depth: number): string {
  return "   ".repeat(depth);
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
