/**
 * Parser and writer for xcschememanagement.plist files.
 *
 * These files control scheme visibility and ordering in Xcode's scheme selector.
 */
import plist from "@expo/plist";

import type {
  XCSchemeManagement,
  SchemeUserState,
  SuppressBuildableAutocreation,
} from "./types";

/**
 * Parse an xcschememanagement.plist string into a typed object.
 */
export function parseManagement(plistString: string): XCSchemeManagement {
  const parsed = plist.parse(plistString) as Record<string, unknown>;

  const result: XCSchemeManagement = {};

  if (parsed.SchemeUserState) {
    result.SchemeUserState = {};
    const userState = parsed.SchemeUserState as Record<
      string,
      Record<string, unknown>
    >;

    for (const [key, value] of Object.entries(userState)) {
      result.SchemeUserState[key] = parseSchemeUserState(value);
    }
  }

  if (parsed.SuppressBuildableAutocreation) {
    result.SuppressBuildableAutocreation = {};
    const suppress = parsed.SuppressBuildableAutocreation as Record<
      string,
      Record<string, unknown>
    >;

    for (const [key, value] of Object.entries(suppress)) {
      result.SuppressBuildableAutocreation[key] =
        parseSuppressBuildableAutocreation(value);
    }
  }

  return result;
}

function parseSchemeUserState(
  data: Record<string, unknown>
): SchemeUserState {
  const state: SchemeUserState = {};

  if (typeof data.isShown === "boolean") {
    state.isShown = data.isShown;
  }
  if (typeof data.orderHint === "number") {
    state.orderHint = data.orderHint;
  }

  return state;
}

function parseSuppressBuildableAutocreation(
  data: Record<string, unknown>
): SuppressBuildableAutocreation {
  const suppress: SuppressBuildableAutocreation = {};

  if (typeof data.primary === "boolean") {
    suppress.primary = data.primary;
  }

  return suppress;
}

/**
 * Build an xcschememanagement.plist string from a typed object.
 */
export function buildManagement(management: XCSchemeManagement): string {
  const obj: Record<string, unknown> = {};

  if (management.SchemeUserState) {
    obj.SchemeUserState = management.SchemeUserState;
  }

  if (management.SuppressBuildableAutocreation) {
    obj.SuppressBuildableAutocreation = management.SuppressBuildableAutocreation;
  }

  return plist.build(obj);
}
