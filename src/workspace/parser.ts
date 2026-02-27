/**
 * Parser for Xcode workspace files (contents.xcworkspacedata)
 *
 * Uses @xmldom/xmldom to parse XML into TypeScript objects.
 */
import { DOMParser } from "@xmldom/xmldom";

import type { XCWorkspace, FileRef, Group } from "./types";

/**
 * Parse an xcworkspacedata XML string into a typed XCWorkspace object.
 */
export function parse(xml: string): XCWorkspace {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");
  const workspaceEl = doc.documentElement;

  if (!workspaceEl || workspaceEl.tagName !== "Workspace") {
    throw new Error(
      "Invalid xcworkspacedata file: root element must be <Workspace>"
    );
  }

  return parseWorkspace(workspaceEl);
}

function parseWorkspace(el: Element): XCWorkspace {
  const workspace: XCWorkspace = {};

  workspace.version = getAttr(el, "version");

  const fileRefs = getChildElements(el, "FileRef");
  if (fileRefs.length > 0) {
    workspace.fileRefs = fileRefs.map(parseFileRef);
  }

  const groups = getChildElements(el, "Group");
  if (groups.length > 0) {
    workspace.groups = groups.map(parseGroup);
  }

  return workspace;
}

function parseFileRef(el: Element): FileRef {
  return {
    location: getAttr(el, "location") || "",
  };
}

function parseGroup(el: Element): Group {
  const group: Group = {};

  group.location = getAttr(el, "location");
  group.name = getAttr(el, "name");

  const fileRefs = getChildElements(el, "FileRef");
  if (fileRefs.length > 0) {
    group.fileRefs = fileRefs.map(parseFileRef);
  }

  const nestedGroups = getChildElements(el, "Group");
  if (nestedGroups.length > 0) {
    group.groups = nestedGroups.map(parseGroup);
  }

  return group;
}

// ============================================================================
// Helper functions
// ============================================================================

function getAttr(el: Element, name: string): string | undefined {
  if (!el.hasAttribute(name)) return undefined;
  return el.getAttribute(name) ?? undefined;
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
