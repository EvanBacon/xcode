import { existsSync, mkdirSync, writeFileSync, rmSync, readFileSync } from "fs";
import path from "path";
import tempy from "tempy";

import { XCSharedData } from "../XCSharedData";
import { XCScheme } from "../XCScheme";

describe("XCSharedData", () => {
  let tempDir: string;
  let sharedDataDir: string;

  beforeEach(() => {
    tempDir = tempy.directory();
    sharedDataDir = path.join(tempDir, "xcshareddata");
    mkdirSync(sharedDataDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe("open", () => {
    it("opens an existing xcshareddata directory", () => {
      const sharedData = XCSharedData.open(sharedDataDir);

      expect(sharedData).toBeDefined();
      expect(sharedData.filePath).toBe(sharedDataDir);
    });

    it("throws when directory does not exist", () => {
      expect(() => {
        XCSharedData.open("/nonexistent/path");
      }).toThrow("Shared data directory does not exist");
    });
  });

  describe("create", () => {
    it("creates a new XCSharedData instance", () => {
      const sharedData = XCSharedData.create();

      expect(sharedData).toBeDefined();
      expect(sharedData.filePath).toBeUndefined();
    });
  });

  describe("schemes", () => {
    it("returns empty array when no schemes exist", () => {
      const sharedData = XCSharedData.open(sharedDataDir);

      expect(sharedData.getSchemes()).toEqual([]);
    });

    it("returns schemes when they exist", () => {
      // Create schemes directory and a scheme file
      const schemesDir = path.join(sharedDataDir, "xcschemes");
      mkdirSync(schemesDir, { recursive: true });

      const schemeXml = `<?xml version="1.0" encoding="UTF-8"?>
<Scheme
   version = "1.7">
   <BuildAction>
   </BuildAction>
</Scheme>
`;
      writeFileSync(path.join(schemesDir, "TestScheme.xcscheme"), schemeXml);

      const sharedData = XCSharedData.open(sharedDataDir);
      const schemes = sharedData.getSchemes();

      expect(schemes).toHaveLength(1);
      expect(schemes[0].name).toBe("TestScheme");
    });

    it("gets a scheme by name", () => {
      const schemesDir = path.join(sharedDataDir, "xcschemes");
      mkdirSync(schemesDir, { recursive: true });

      const schemeXml = `<?xml version="1.0" encoding="UTF-8"?>
<Scheme
   version = "1.7">
   <BuildAction>
   </BuildAction>
</Scheme>
`;
      writeFileSync(path.join(schemesDir, "MyApp.xcscheme"), schemeXml);

      const sharedData = XCSharedData.open(sharedDataDir);
      const scheme = sharedData.getScheme("MyApp");

      expect(scheme).not.toBeNull();
      expect(scheme!.name).toBe("MyApp");
    });

    it("returns null for non-existent scheme", () => {
      const sharedData = XCSharedData.open(sharedDataDir);

      expect(sharedData.getScheme("NonExistent")).toBeNull();
    });

    it("saves a scheme", () => {
      const sharedData = XCSharedData.open(sharedDataDir);
      const scheme = XCScheme.create("NewScheme");

      sharedData.saveScheme(scheme);

      const schemePath = path.join(
        sharedDataDir,
        "xcschemes",
        "NewScheme.xcscheme"
      );
      expect(existsSync(schemePath)).toBe(true);
    });
  });

  describe("breakpoints", () => {
    it("returns undefined when no breakpoints file exists", () => {
      const sharedData = XCSharedData.open(sharedDataDir);

      expect(sharedData.breakpoints).toBeUndefined();
    });

    it("loads breakpoints when file exists", () => {
      const debuggerDir = path.join(sharedDataDir, "xcdebugger");
      mkdirSync(debuggerDir, { recursive: true });

      const breakpointsXml = `<?xml version="1.0" encoding="UTF-8"?>
<Bucket
   uuid = "TEST-UUID"
   type = "1"
   version = "2.0">
   <Breakpoints>
   </Breakpoints>
</Bucket>
`;
      writeFileSync(
        path.join(debuggerDir, "Breakpoints_v2.xcbkptlist"),
        breakpointsXml
      );

      const sharedData = XCSharedData.open(sharedDataDir);

      expect(sharedData.breakpoints).toBeDefined();
      expect(sharedData.breakpoints!.uuid).toBe("TEST-UUID");
    });

    it("saves breakpoints", () => {
      const sharedData = XCSharedData.open(sharedDataDir);
      sharedData.breakpoints = {
        uuid: "NEW-UUID",
        type: "1",
        version: "2.0",
        breakpoints: [],
      };

      sharedData.saveBreakpoints();

      const breakpointsPath = path.join(
        sharedDataDir,
        "xcdebugger",
        "Breakpoints_v2.xcbkptlist"
      );
      expect(existsSync(breakpointsPath)).toBe(true);

      const content = readFileSync(breakpointsPath, "utf-8");
      expect(content).toContain('uuid = "NEW-UUID"');
    });
  });

  describe("workspaceSettings", () => {
    it("returns undefined when no settings file exists", () => {
      const sharedData = XCSharedData.open(sharedDataDir);

      expect(sharedData.workspaceSettings).toBeUndefined();
    });

    it("loads workspace settings when file exists", () => {
      const settingsPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>PreviewsEnabled</key>
	<true/>
</dict>
</plist>`;
      writeFileSync(
        path.join(sharedDataDir, "WorkspaceSettings.xcsettings"),
        settingsPlist
      );

      const sharedData = XCSharedData.open(sharedDataDir);

      expect(sharedData.workspaceSettings).toBeDefined();
      expect(sharedData.workspaceSettings!.PreviewsEnabled).toBe(true);
    });

    it("saves workspace settings", () => {
      const sharedData = XCSharedData.open(sharedDataDir);
      sharedData.workspaceSettings = {
        PreviewsEnabled: false,
        IDEWorkspaceSharedSettings_AutocreateContextsIfNeeded: true,
      };

      sharedData.saveWorkspaceSettings();

      const settingsPath = path.join(
        sharedDataDir,
        "WorkspaceSettings.xcsettings"
      );
      expect(existsSync(settingsPath)).toBe(true);

      const content = readFileSync(settingsPath, "utf-8");
      expect(content).toContain("<key>PreviewsEnabled</key>");
      expect(content).toContain("<false/>");
    });
  });

  describe("save", () => {
    it("saves all modified data", () => {
      const sharedData = XCSharedData.create();
      sharedData.filePath = sharedDataDir;

      sharedData.breakpoints = {
        uuid: "SAVE-TEST",
        type: "1",
        version: "2.0",
        breakpoints: [],
      };

      sharedData.workspaceSettings = {
        PreviewsEnabled: true,
      };

      sharedData.save();

      expect(
        existsSync(
          path.join(sharedDataDir, "xcdebugger", "Breakpoints_v2.xcbkptlist")
        )
      ).toBe(true);
      expect(
        existsSync(path.join(sharedDataDir, "WorkspaceSettings.xcsettings"))
      ).toBe(true);
    });

    it("saves to a new path when provided", () => {
      const newDir = path.join(tempDir, "new-xcshareddata");

      const sharedData = XCSharedData.create();
      sharedData.breakpoints = {
        uuid: "NEW-PATH-TEST",
        type: "1",
        version: "2.0",
        breakpoints: [],
      };

      sharedData.save(newDir);

      expect(sharedData.filePath).toBe(newDir);
      expect(
        existsSync(path.join(newDir, "xcdebugger", "Breakpoints_v2.xcbkptlist"))
      ).toBe(true);
    });

    it("throws when no path is set", () => {
      const sharedData = XCSharedData.create();
      sharedData.breakpoints = {
        uuid: "TEST",
        type: "1",
        version: "2.0",
        breakpoints: [],
      };

      expect(() => {
        sharedData.save();
      }).toThrow("No file path specified");
    });
  });

  describe("lazy loading", () => {
    it("only loads breakpoints once", () => {
      const debuggerDir = path.join(sharedDataDir, "xcdebugger");
      mkdirSync(debuggerDir, { recursive: true });

      const breakpointsXml = `<?xml version="1.0" encoding="UTF-8"?>
<Bucket
   uuid = "LAZY-TEST"
   type = "1"
   version = "2.0">
   <Breakpoints>
   </Breakpoints>
</Bucket>
`;
      writeFileSync(
        path.join(debuggerDir, "Breakpoints_v2.xcbkptlist"),
        breakpointsXml
      );

      const sharedData = XCSharedData.open(sharedDataDir);

      // Access twice
      const first = sharedData.breakpoints;
      const second = sharedData.breakpoints;

      // Should be the same object
      expect(first).toBe(second);
    });
  });
});
