import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import path from "path";
import tempy from "tempy";

import { IDEWorkspaceChecks } from "../IDEWorkspaceChecks";
import { XCWorkspace } from "../XCWorkspace";

describe("IDEWorkspaceChecks", () => {
  describe("create", () => {
    it("creates with default values", () => {
      const checks = IDEWorkspaceChecks.create();

      expect(checks.props.IDEDidComputeMac32BitWarning).toBe(true);
      expect(checks.filePath).toBeUndefined();
    });

    it("creates with custom props", () => {
      const checks = IDEWorkspaceChecks.create({
        props: {
          IDEDidComputeMac32BitWarning: false,
          SomeOtherFlag: true,
        },
      });

      expect(checks.props.IDEDidComputeMac32BitWarning).toBe(false);
      expect(checks.props.SomeOtherFlag).toBe(true);
    });

    it("creates with file path", () => {
      const checks = IDEWorkspaceChecks.create({
        filePath: "/path/to/checks.plist",
      });

      expect(checks.filePath).toBe("/path/to/checks.plist");
    });
  });

  describe("open", () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = tempy.directory();
    });

    afterEach(() => {
      if (existsSync(tempDir)) {
        rmSync(tempDir, { recursive: true });
      }
    });

    it("opens existing checks from workspace", () => {
      const workspacePath = path.join(tempDir, "Test.xcworkspace");
      const sharedDataPath = path.join(workspacePath, "xcshareddata");
      mkdirSync(sharedDataPath, { recursive: true });
      writeFileSync(
        path.join(sharedDataPath, "IDEWorkspaceChecks.plist"),
        `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>IDEDidComputeMac32BitWarning</key>
	<true/>
</dict>
</plist>`
      );

      const checks = IDEWorkspaceChecks.open(workspacePath);

      expect(checks).not.toBeNull();
      expect(checks!.props.IDEDidComputeMac32BitWarning).toBe(true);
      expect(checks!.filePath).toBe(
        path.join(sharedDataPath, "IDEWorkspaceChecks.plist")
      );
    });

    it("returns null when file does not exist", () => {
      const workspacePath = path.join(tempDir, "Test.xcworkspace");
      mkdirSync(workspacePath, { recursive: true });

      const checks = IDEWorkspaceChecks.open(workspacePath);

      expect(checks).toBeNull();
    });
  });

  describe("openOrCreate", () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = tempy.directory();
    });

    afterEach(() => {
      if (existsSync(tempDir)) {
        rmSync(tempDir, { recursive: true });
      }
    });

    it("opens existing checks", () => {
      const workspacePath = path.join(tempDir, "Test.xcworkspace");
      const sharedDataPath = path.join(workspacePath, "xcshareddata");
      mkdirSync(sharedDataPath, { recursive: true });
      writeFileSync(
        path.join(sharedDataPath, "IDEWorkspaceChecks.plist"),
        `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>IDEDidComputeMac32BitWarning</key>
	<false/>
</dict>
</plist>`
      );

      const checks = IDEWorkspaceChecks.openOrCreate(workspacePath);

      expect(checks.props.IDEDidComputeMac32BitWarning).toBe(false);
    });

    it("creates new checks when file does not exist", () => {
      const workspacePath = path.join(tempDir, "Test.xcworkspace");
      mkdirSync(workspacePath, { recursive: true });

      const checks = IDEWorkspaceChecks.openOrCreate(workspacePath);

      expect(checks.props.IDEDidComputeMac32BitWarning).toBe(true);
      expect(checks.filePath).toBe(
        path.join(workspacePath, "xcshareddata/IDEWorkspaceChecks.plist")
      );
    });
  });

  describe("save", () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = tempy.directory();
    });

    afterEach(() => {
      if (existsSync(tempDir)) {
        rmSync(tempDir, { recursive: true });
      }
    });

    it("saves to specified path", () => {
      const checks = IDEWorkspaceChecks.create();
      const filePath = path.join(tempDir, "checks.plist");

      checks.save(filePath);

      expect(existsSync(filePath)).toBe(true);
      const content = readFileSync(filePath, "utf-8");
      expect(content).toContain("IDEDidComputeMac32BitWarning");
    });

    it("creates xcshareddata directory if needed", () => {
      const workspacePath = path.join(tempDir, "Test.xcworkspace");
      mkdirSync(workspacePath, { recursive: true });

      const checks = IDEWorkspaceChecks.create();
      const filePath = path.join(
        workspacePath,
        "xcshareddata/IDEWorkspaceChecks.plist"
      );

      checks.save(filePath);

      expect(existsSync(filePath)).toBe(true);
    });

    it("uses filePath when no argument provided", () => {
      const filePath = path.join(tempDir, "checks.plist");
      const checks = IDEWorkspaceChecks.create({ filePath });

      checks.save();

      expect(existsSync(filePath)).toBe(true);
    });

    it("throws when no path specified", () => {
      const checks = IDEWorkspaceChecks.create();

      expect(() => checks.save()).toThrow("No file path specified");
    });
  });

  describe("saveToWorkspace", () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = tempy.directory();
    });

    afterEach(() => {
      if (existsSync(tempDir)) {
        rmSync(tempDir, { recursive: true });
      }
    });

    it("saves to workspace path", () => {
      const workspacePath = path.join(tempDir, "Test.xcworkspace");
      mkdirSync(workspacePath, { recursive: true });

      const checks = IDEWorkspaceChecks.create();
      checks.saveToWorkspace(workspacePath);

      const expectedPath = path.join(
        workspacePath,
        "xcshareddata/IDEWorkspaceChecks.plist"
      );
      expect(existsSync(expectedPath)).toBe(true);
    });
  });

  describe("toPlist", () => {
    it("returns plist string", () => {
      const checks = IDEWorkspaceChecks.create();

      const plist = checks.toPlist();

      expect(plist).toContain("<?xml version=");
      expect(plist).toContain("IDEDidComputeMac32BitWarning");
      expect(plist).toContain("<true/>");
    });
  });

  describe("mac32BitWarningComputed", () => {
    it("gets value", () => {
      const checks = IDEWorkspaceChecks.create({
        props: { IDEDidComputeMac32BitWarning: true },
      });

      expect(checks.mac32BitWarningComputed).toBe(true);
    });

    it("defaults to true when props is empty", () => {
      const checks = IDEWorkspaceChecks.create({
        props: {},
      });

      // create() merges with defaults, so IDEDidComputeMac32BitWarning is always true
      expect(checks.mac32BitWarningComputed).toBe(true);
    });

    it("sets value", () => {
      const checks = IDEWorkspaceChecks.create({
        props: { IDEDidComputeMac32BitWarning: true },
      });

      checks.mac32BitWarningComputed = false;

      expect(checks.props.IDEDidComputeMac32BitWarning).toBe(false);
    });
  });

  describe("getCheck/setCheck/removeCheck", () => {
    it("gets check value", () => {
      const checks = IDEWorkspaceChecks.create({
        props: { CustomFlag: true },
      });

      expect(checks.getCheck("CustomFlag")).toBe(true);
    });

    it("returns undefined for missing check", () => {
      const checks = IDEWorkspaceChecks.create();

      expect(checks.getCheck("NonexistentFlag")).toBeUndefined();
    });

    it("sets check value", () => {
      const checks = IDEWorkspaceChecks.create();

      checks.setCheck("CustomFlag", true);

      expect(checks.props.CustomFlag).toBe(true);
    });

    it("removes check", () => {
      const checks = IDEWorkspaceChecks.create({
        props: { CustomFlag: true },
      });

      const result = checks.removeCheck("CustomFlag");

      expect(result).toBe(true);
      expect(checks.props.CustomFlag).toBeUndefined();
    });

    it("returns false when removing non-existent check", () => {
      const checks = IDEWorkspaceChecks.create();

      const result = checks.removeCheck("NonexistentFlag");

      expect(result).toBe(false);
    });
  });
});

describe("XCWorkspace integration", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = tempy.directory();
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true });
    }
  });

  describe("getWorkspaceChecks", () => {
    it("returns null when no file path", () => {
      const workspace = XCWorkspace.create("Test");

      expect(workspace.getWorkspaceChecks()).toBeNull();
    });

    it("returns null when checks do not exist", () => {
      const workspacePath = path.join(tempDir, "Test.xcworkspace");
      mkdirSync(workspacePath, { recursive: true });
      writeFileSync(
        path.join(workspacePath, "contents.xcworkspacedata"),
        `<?xml version="1.0" encoding="UTF-8"?>
<Workspace version = "1.0"></Workspace>`
      );

      const workspace = XCWorkspace.open(workspacePath);

      expect(workspace.getWorkspaceChecks()).toBeNull();
    });

    it("returns checks when they exist", () => {
      const workspacePath = path.join(tempDir, "Test.xcworkspace");
      const sharedDataPath = path.join(workspacePath, "xcshareddata");
      mkdirSync(sharedDataPath, { recursive: true });
      writeFileSync(
        path.join(workspacePath, "contents.xcworkspacedata"),
        `<?xml version="1.0" encoding="UTF-8"?>
<Workspace version = "1.0"></Workspace>`
      );
      writeFileSync(
        path.join(sharedDataPath, "IDEWorkspaceChecks.plist"),
        `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>IDEDidComputeMac32BitWarning</key>
	<true/>
</dict>
</plist>`
      );

      const workspace = XCWorkspace.open(workspacePath);
      const checks = workspace.getWorkspaceChecks();

      expect(checks).not.toBeNull();
      expect(checks!.mac32BitWarningComputed).toBe(true);
    });
  });

  describe("getOrCreateWorkspaceChecks", () => {
    it("throws when workspace has no file path", () => {
      const workspace = XCWorkspace.create("Test");

      expect(() => workspace.getOrCreateWorkspaceChecks()).toThrow(
        "Workspace must be saved before accessing workspace checks"
      );
    });

    it("creates checks when they do not exist", () => {
      const workspacePath = path.join(tempDir, "Test.xcworkspace");
      mkdirSync(workspacePath, { recursive: true });
      writeFileSync(
        path.join(workspacePath, "contents.xcworkspacedata"),
        `<?xml version="1.0" encoding="UTF-8"?>
<Workspace version = "1.0"></Workspace>`
      );

      const workspace = XCWorkspace.open(workspacePath);
      const checks = workspace.getOrCreateWorkspaceChecks();

      expect(checks.mac32BitWarningComputed).toBe(true);
    });
  });

  describe("hasWorkspaceChecks", () => {
    it("returns false when no file path", () => {
      const workspace = XCWorkspace.create("Test");

      expect(workspace.hasWorkspaceChecks()).toBe(false);
    });

    it("returns false when checks do not exist", () => {
      const workspacePath = path.join(tempDir, "Test.xcworkspace");
      mkdirSync(workspacePath, { recursive: true });
      writeFileSync(
        path.join(workspacePath, "contents.xcworkspacedata"),
        `<?xml version="1.0" encoding="UTF-8"?>
<Workspace version = "1.0"></Workspace>`
      );

      const workspace = XCWorkspace.open(workspacePath);

      expect(workspace.hasWorkspaceChecks()).toBe(false);
    });

    it("returns true when checks exist", () => {
      const workspacePath = path.join(tempDir, "Test.xcworkspace");
      const sharedDataPath = path.join(workspacePath, "xcshareddata");
      mkdirSync(sharedDataPath, { recursive: true });
      writeFileSync(
        path.join(workspacePath, "contents.xcworkspacedata"),
        `<?xml version="1.0" encoding="UTF-8"?>
<Workspace version = "1.0"></Workspace>`
      );
      writeFileSync(
        path.join(sharedDataPath, "IDEWorkspaceChecks.plist"),
        `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>IDEDidComputeMac32BitWarning</key>
	<true/>
</dict>
</plist>`
      );

      const workspace = XCWorkspace.open(workspacePath);

      expect(workspace.hasWorkspaceChecks()).toBe(true);
    });
  });

  describe("setMac32BitWarningComputed", () => {
    it("creates checks file with warning computed flag", () => {
      const workspacePath = path.join(tempDir, "Test.xcworkspace");
      mkdirSync(workspacePath, { recursive: true });
      writeFileSync(
        path.join(workspacePath, "contents.xcworkspacedata"),
        `<?xml version="1.0" encoding="UTF-8"?>
<Workspace version = "1.0"></Workspace>`
      );

      const workspace = XCWorkspace.open(workspacePath);
      workspace.setMac32BitWarningComputed();

      const checksPath = path.join(
        workspacePath,
        "xcshareddata/IDEWorkspaceChecks.plist"
      );
      expect(existsSync(checksPath)).toBe(true);

      const content = readFileSync(checksPath, "utf-8");
      expect(content).toContain("IDEDidComputeMac32BitWarning");
      expect(content).toContain("<true/>");
    });
  });
});
