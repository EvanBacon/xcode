/**
 * Parser for Xcode breakpoint list files (Breakpoints_v2.xcbkptlist)
 *
 * Uses @xmldom/xmldom to parse XML into TypeScript objects.
 */
import { DOMParser } from "@xmldom/xmldom";

import type {
  XCBreakpointList,
  BreakpointProxy,
  BreakpointContent,
  BreakpointActionProxy,
  BreakpointActionContent,
  BreakpointLocation,
} from "./types";

/**
 * Parse a breakpoint list XML string into a typed XCBreakpointList object.
 */
export function parse(xml: string): XCBreakpointList {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");
  const bucketEl = doc.documentElement;

  if (!bucketEl || bucketEl.tagName !== "Bucket") {
    throw new Error(
      "Invalid breakpoint list file: root element must be <Bucket>"
    );
  }

  return parseBucket(bucketEl);
}

function parseBucket(el: Element): XCBreakpointList {
  const list: XCBreakpointList = {};

  list.uuid = getAttr(el, "uuid");
  list.type = getAttr(el, "type");
  list.version = getAttr(el, "version");

  const breakpointsEl = getChildElement(el, "Breakpoints");
  if (breakpointsEl) {
    list.breakpoints = getChildElements(breakpointsEl, "BreakpointProxy").map(
      parseBreakpointProxy
    );
  }

  return list;
}

function parseBreakpointProxy(el: Element): BreakpointProxy {
  const proxy: BreakpointProxy = {
    breakpointExtensionID: getAttr(el, "BreakpointExtensionID") || "",
  };

  const contentEl = getChildElement(el, "BreakpointContent");
  if (contentEl) {
    proxy.breakpointContent = parseBreakpointContent(contentEl);
  }

  return proxy;
}

function parseBreakpointContent(el: Element): BreakpointContent {
  const content: BreakpointContent = {};

  content.uuid = getAttr(el, "uuid");
  content.shouldBeEnabled = getBoolAttr(el, "shouldBeEnabled");
  content.ignoreCount = getIntAttr(el, "ignoreCount");
  content.continueAfterRunningActions = getBoolAttr(
    el,
    "continueAfterRunningActions"
  );
  content.filePath = getAttr(el, "filePath");
  content.startingColumnNumber = getAttr(el, "startingColumnNumber");
  content.endingColumnNumber = getAttr(el, "endingColumnNumber");
  content.startingLineNumber = getAttr(el, "startingLineNumber");
  content.endingLineNumber = getAttr(el, "endingLineNumber");
  content.landmarkName = getAttr(el, "landmarkName");
  content.landmarkType = getAttr(el, "landmarkType");
  content.condition = getAttr(el, "condition");
  content.scope = getAttr(el, "scope");
  content.symbolName = getAttr(el, "symbolName");
  content.moduleName = getAttr(el, "moduleName");
  content.exceptionType = getAttr(el, "exceptionType");
  content.stopOnStyle = getAttr(el, "stopOnStyle");

  const actionsEl = getChildElement(el, "Actions");
  if (actionsEl) {
    content.actions = getChildElements(actionsEl, "BreakpointActionProxy").map(
      parseBreakpointActionProxy
    );
  }

  const locationsEl = getChildElement(el, "Locations");
  if (locationsEl) {
    content.locations = getChildElements(
      locationsEl,
      "BreakpointLocationProxy"
    ).map(parseBreakpointLocation);
  }

  return content;
}

function parseBreakpointActionProxy(el: Element): BreakpointActionProxy {
  const proxy: BreakpointActionProxy = {
    actionExtensionID: getAttr(el, "ActionExtensionID") || "",
  };

  const contentEl = getChildElement(el, "ActionContent");
  if (contentEl) {
    proxy.actionContent = parseBreakpointActionContent(contentEl);
  }

  return proxy;
}

function parseBreakpointActionContent(el: Element): BreakpointActionContent {
  const content: BreakpointActionContent = {};

  content.consoleCommand = getAttr(el, "consoleCommand");
  content.message = getAttr(el, "message");
  content.conveyanceType = getAttr(el, "conveyanceType");
  content.shellCommand = getAttr(el, "shellCommand");
  content.shellArguments = getAttr(el, "shellArguments");
  content.waitUntilDone = getBoolAttr(el, "waitUntilDone");
  content.script = getAttr(el, "script");
  content.soundName = getAttr(el, "soundName");

  return content;
}

function parseBreakpointLocation(el: Element): BreakpointLocation {
  // Handle the wrapper element (BreakpointLocationProxy)
  const locationContentEl = getChildElement(el, "BreakpointLocationContent");
  const targetEl = locationContentEl || el;

  const location: BreakpointLocation = {};

  location.uuid = getAttr(targetEl, "uuid");
  location.shouldBeEnabled = getBoolAttr(targetEl, "shouldBeEnabled");
  location.ignoreCount = getIntAttr(targetEl, "ignoreCount");
  location.continueAfterRunningActions = getBoolAttr(
    targetEl,
    "continueAfterRunningActions"
  );
  location.symbolName = getAttr(targetEl, "symbolName");
  location.moduleName = getAttr(targetEl, "moduleName");
  location.urlString = getAttr(targetEl, "urlString");
  location.startingLineNumber = getAttr(targetEl, "startingLineNumber");
  location.endingLineNumber = getAttr(targetEl, "endingLineNumber");
  location.startingColumnNumber = getAttr(targetEl, "startingColumnNumber");
  location.endingColumnNumber = getAttr(targetEl, "endingColumnNumber");

  return location;
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
  if (value === "Yes" || value === "YES") return true;
  if (value === "No" || value === "NO") return false;
  return undefined;
}

function getIntAttr(el: Element, name: string): number | undefined {
  const value = el.getAttribute(name);
  if (value === null || value === undefined) return undefined;
  const num = parseInt(value, 10);
  return isNaN(num) ? undefined : num;
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
