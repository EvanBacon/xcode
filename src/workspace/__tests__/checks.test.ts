import { readFileSync } from "fs";
import path from "path";

import { parseChecks, buildChecks } from "../checks";
import type { IDEWorkspaceChecks } from "../types";

const fixturesDir = path.join(__dirname, "fixtures");

function readFixture(name: string): string {
  return readFileSync(path.join(fixturesDir, name), "utf-8");
}

describe("checks parser", () => {
  describe("parseChecks", () => {
    it("parses basic IDEWorkspaceChecks.plist", () => {
      const plistString = readFixture("IDEWorkspaceChecks.plist");
      const checks = parseChecks(plistString);

      expect(checks.IDEDidComputeMac32BitWarning).toBe(true);
    });

    it("parses plist with multiple flags", () => {
      const plistString = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>IDEDidComputeMac32BitWarning</key>
	<true/>
	<key>SomeOtherFlag</key>
	<false/>
</dict>
</plist>`;

      const checks = parseChecks(plistString);

      expect(checks.IDEDidComputeMac32BitWarning).toBe(true);
      expect(checks.SomeOtherFlag).toBe(false);
    });

    it("parses empty plist", () => {
      const plistString = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
</dict>
</plist>`;

      const checks = parseChecks(plistString);

      expect(Object.keys(checks)).toHaveLength(0);
    });

    it("ignores non-boolean values", () => {
      const plistString = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>IDEDidComputeMac32BitWarning</key>
	<true/>
	<key>SomeString</key>
	<string>hello</string>
	<key>SomeNumber</key>
	<integer>42</integer>
</dict>
</plist>`;

      const checks = parseChecks(plistString);

      expect(checks.IDEDidComputeMac32BitWarning).toBe(true);
      expect(checks.SomeString).toBeUndefined();
      expect(checks.SomeNumber).toBeUndefined();
    });
  });

  describe("buildChecks", () => {
    it("builds basic checks plist", () => {
      const checks: IDEWorkspaceChecks = {
        IDEDidComputeMac32BitWarning: true,
      };

      const plistString = buildChecks(checks);

      expect(plistString).toContain("IDEDidComputeMac32BitWarning");
      expect(plistString).toContain("<true/>");
    });

    it("builds plist with multiple flags", () => {
      const checks: IDEWorkspaceChecks = {
        IDEDidComputeMac32BitWarning: true,
        SomeOtherFlag: false,
      };

      const plistString = buildChecks(checks);

      expect(plistString).toContain("IDEDidComputeMac32BitWarning");
      expect(plistString).toContain("<true/>");
      expect(plistString).toContain("SomeOtherFlag");
      expect(plistString).toContain("<false/>");
    });

    it("filters undefined values", () => {
      const checks: IDEWorkspaceChecks = {
        IDEDidComputeMac32BitWarning: true,
        UndefinedFlag: undefined,
      };

      const plistString = buildChecks(checks);

      expect(plistString).toContain("IDEDidComputeMac32BitWarning");
      expect(plistString).not.toContain("UndefinedFlag");
    });

    it("builds empty checks", () => {
      const checks: IDEWorkspaceChecks = {};

      const plistString = buildChecks(checks);

      expect(plistString).toContain("<dict/>");
    });
  });

  describe("round-trip", () => {
    it("round-trips fixture data", () => {
      const plistString = readFixture("IDEWorkspaceChecks.plist");
      const checks = parseChecks(plistString);
      const rebuilt = buildChecks(checks);
      const reparsed = parseChecks(rebuilt);

      expect(reparsed).toEqual(checks);
    });

    it("round-trips multiple flags", () => {
      const original: IDEWorkspaceChecks = {
        IDEDidComputeMac32BitWarning: true,
        SomeOtherFlag: false,
        AnotherFlag: true,
      };

      const plistString = buildChecks(original);
      const reparsed = parseChecks(plistString);

      expect(reparsed).toEqual(original);
    });
  });
});
