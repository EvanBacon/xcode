import { readFileSync } from "fs";
import path from "path";

import { parse, build } from "../index";
import type { WorkspaceSettings } from "../types";

const fixturesDir = path.join(__dirname, "fixtures");

function readFixture(name: string): string {
  return readFileSync(path.join(fixturesDir, name), "utf-8");
}

describe("settings parser", () => {
  describe("parse", () => {
    it("parses WorkspaceSettings.xcsettings", () => {
      const plistStr = readFixture("WorkspaceSettings.xcsettings");
      const settings = parse(plistStr);

      expect(settings.BuildSystemType).toBe("Original");
      expect(settings.DerivedDataLocationStyle).toBe("WorkspaceRelativePath");
      expect(settings.IDEWorkspaceSharedSettings_AutocreateContextsIfNeeded).toBe(false);
      expect(settings.PreviewsEnabled).toBe(true);
      expect(settings.LiveSourceIssuesEnabled).toBe(true);
    });

    it("parses empty settings", () => {
      const plistStr = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
</dict>
</plist>`;

      const settings = parse(plistStr);

      expect(settings.BuildSystemType).toBeUndefined();
      expect(settings.PreviewsEnabled).toBeUndefined();
    });
  });

  describe("build", () => {
    it("builds workspace settings", () => {
      const settings: WorkspaceSettings = {
        BuildSystemType: "New",
        DerivedDataLocationStyle: "Default",
        IDEWorkspaceSharedSettings_AutocreateContextsIfNeeded: true,
        PreviewsEnabled: false,
      };

      const plistStr = build(settings);

      expect(plistStr).toContain("<plist");
      expect(plistStr).toContain("<key>BuildSystemType</key>");
      expect(plistStr).toContain("<string>New</string>");
      expect(plistStr).toContain("<key>DerivedDataLocationStyle</key>");
      expect(plistStr).toContain("<string>Default</string>");
      expect(plistStr).toContain(
        "<key>IDEWorkspaceSharedSettings_AutocreateContextsIfNeeded</key>"
      );
      expect(plistStr).toContain("<true/>");
      expect(plistStr).toContain("<key>PreviewsEnabled</key>");
      expect(plistStr).toContain("<false/>");
    });

    it("builds empty settings", () => {
      const settings: WorkspaceSettings = {};

      const plistStr = build(settings);

      expect(plistStr).toContain("<plist");
      expect(plistStr).toContain("<dict/>");
    });

    it("builds settings with custom derived data location", () => {
      const settings: WorkspaceSettings = {
        DerivedDataLocationStyle: "CustomLocation",
        DerivedDataCustomLocation: "/Users/me/DerivedData",
      };

      const plistStr = build(settings);

      expect(plistStr).toContain("<key>DerivedDataLocationStyle</key>");
      expect(plistStr).toContain("<string>CustomLocation</string>");
      expect(plistStr).toContain("<key>DerivedDataCustomLocation</key>");
      expect(plistStr).toContain("<string>/Users/me/DerivedData</string>");
    });
  });

  describe("round-trip", () => {
    it("round-trips WorkspaceSettings.xcsettings", () => {
      const plistStr = readFixture("WorkspaceSettings.xcsettings");
      const settings = parse(plistStr);
      const rebuilt = build(settings);
      const reparsed = parse(rebuilt);

      expect(reparsed).toEqual(settings);
    });
  });

  describe("parsing stability", () => {
    it("produces identical results on multiple parses", () => {
      const plistStr = readFixture("WorkspaceSettings.xcsettings");
      const parses = Array.from({ length: 5 }, () => parse(plistStr));

      for (let i = 1; i < parses.length; i++) {
        expect(parses[i]).toEqual(parses[0]);
      }
    });
  });
});
