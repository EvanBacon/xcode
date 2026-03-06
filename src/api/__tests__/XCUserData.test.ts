import { existsSync, mkdirSync, writeFileSync, rmSync, readFileSync } from "fs";
import path from "path";
import tempy from "tempy";

import { XCUserData } from "../XCUserData";
import { XCScheme } from "../XCScheme";

describe("XCUserData", () => {
  let tempDir: string;
  let userDataDir: string;

  beforeEach(() => {
    tempDir = tempy.directory();
    userDataDir = path.join(tempDir, "testuser.xcuserdatad");
    mkdirSync(userDataDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe("open", () => {
    it("opens an existing xcuserdatad directory", () => {
      const userData = XCUserData.open(userDataDir);

      expect(userData).toBeDefined();
      expect(userData.filePath).toBe(userDataDir);
      expect(userData.userName).toBe("testuser");
    });

    it("extracts username from directory name", () => {
      const otherDir = path.join(tempDir, "john.doe.xcuserdatad");
      mkdirSync(otherDir, { recursive: true });

      const userData = XCUserData.open(otherDir);

      expect(userData.userName).toBe("john.doe");
    });

    it("throws when directory does not exist", () => {
      expect(() => {
        XCUserData.open("/nonexistent/path");
      }).toThrow("User data directory does not exist");
    });

    it("throws when directory name is invalid", () => {
      const invalidDir = path.join(tempDir, "invalid-dir");
      mkdirSync(invalidDir, { recursive: true });

      expect(() => {
        XCUserData.open(invalidDir);
      }).toThrow("Invalid user data directory name");
    });
  });

  describe("create", () => {
    it("creates a new XCUserData instance", () => {
      const userData = XCUserData.create("newuser");

      expect(userData).toBeDefined();
      expect(userData.filePath).toBeUndefined();
      expect(userData.userName).toBe("newuser");
    });

    it("returns correct directory name", () => {
      const userData = XCUserData.create("myuser");

      expect(userData.getDirName()).toBe("myuser.xcuserdatad");
    });
  });

  describe("discoverUsers", () => {
    it("returns empty array when xcuserdata does not exist", () => {
      const users = XCUserData.discoverUsers("/nonexistent/xcuserdata");

      expect(users).toEqual([]);
    });

    it("discovers all user data directories", () => {
      const xcuserdata = path.join(tempDir, "xcuserdata");
      mkdirSync(xcuserdata, { recursive: true });

      mkdirSync(path.join(xcuserdata, "user1.xcuserdatad"));
      mkdirSync(path.join(xcuserdata, "user2.xcuserdatad"));
      mkdirSync(path.join(xcuserdata, "user3.xcuserdatad"));
      mkdirSync(path.join(xcuserdata, "not-userdata")); // Should be ignored

      const users = XCUserData.discoverUsers(xcuserdata);

      expect(users).toHaveLength(3);
      expect(users.map((u) => u.userName).sort()).toEqual([
        "user1",
        "user2",
        "user3",
      ]);
    });
  });

  describe("schemes", () => {
    it("returns empty array when no schemes exist", () => {
      const userData = XCUserData.open(userDataDir);

      expect(userData.getSchemes()).toEqual([]);
    });

    it("returns schemes when they exist", () => {
      const schemesDir = path.join(userDataDir, "xcschemes");
      mkdirSync(schemesDir, { recursive: true });

      const schemeXml = `<?xml version="1.0" encoding="UTF-8"?>
<Scheme
   version = "1.7">
   <BuildAction>
   </BuildAction>
</Scheme>
`;
      writeFileSync(path.join(schemesDir, "UserScheme.xcscheme"), schemeXml);

      const userData = XCUserData.open(userDataDir);
      const schemes = userData.getSchemes();

      expect(schemes).toHaveLength(1);
      expect(schemes[0].name).toBe("UserScheme");
    });

    it("gets a scheme by name", () => {
      const schemesDir = path.join(userDataDir, "xcschemes");
      mkdirSync(schemesDir, { recursive: true });

      const schemeXml = `<?xml version="1.0" encoding="UTF-8"?>
<Scheme
   version = "1.7">
   <BuildAction>
   </BuildAction>
</Scheme>
`;
      writeFileSync(path.join(schemesDir, "MyUserScheme.xcscheme"), schemeXml);

      const userData = XCUserData.open(userDataDir);
      const scheme = userData.getScheme("MyUserScheme");

      expect(scheme).not.toBeNull();
      expect(scheme!.name).toBe("MyUserScheme");
    });

    it("returns null for non-existent scheme", () => {
      const userData = XCUserData.open(userDataDir);

      expect(userData.getScheme("NonExistent")).toBeNull();
    });

    it("saves a scheme", () => {
      const userData = XCUserData.open(userDataDir);
      const scheme = XCScheme.create("NewUserScheme");

      userData.saveScheme(scheme);

      const schemePath = path.join(
        userDataDir,
        "xcschemes",
        "NewUserScheme.xcscheme"
      );
      expect(existsSync(schemePath)).toBe(true);
    });
  });

  describe("schemeManagement", () => {
    it("returns undefined when no management file exists", () => {
      const userData = XCUserData.open(userDataDir);

      expect(userData.schemeManagement).toBeUndefined();
    });

    it("loads scheme management when file exists", () => {
      const schemesDir = path.join(userDataDir, "xcschemes");
      mkdirSync(schemesDir, { recursive: true });

      const managementPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>SchemeUserState</key>
	<dict>
		<key>App.xcscheme</key>
		<dict>
			<key>orderHint</key>
			<integer>0</integer>
		</dict>
	</dict>
</dict>
</plist>`;
      writeFileSync(
        path.join(schemesDir, "xcschememanagement.plist"),
        managementPlist
      );

      const userData = XCUserData.open(userDataDir);

      expect(userData.schemeManagement).toBeDefined();
      expect(userData.schemeManagement!.SchemeUserState).toBeDefined();
    });

    it("saves scheme management", () => {
      const userData = XCUserData.open(userDataDir);
      userData.schemeManagement = {
        SchemeUserState: {
          "Test.xcscheme": {
            orderHint: 1,
          },
        },
      };

      userData.saveSchemeManagement();

      const managementPath = path.join(
        userDataDir,
        "xcschemes",
        "xcschememanagement.plist"
      );
      expect(existsSync(managementPath)).toBe(true);

      const content = readFileSync(managementPath, "utf-8");
      expect(content).toContain("SchemeUserState");
      expect(content).toContain("Test.xcscheme");
    });
  });

  describe("breakpoints", () => {
    it("returns undefined when no breakpoints file exists", () => {
      const userData = XCUserData.open(userDataDir);

      expect(userData.breakpoints).toBeUndefined();
    });

    it("loads breakpoints when file exists", () => {
      const debuggerDir = path.join(userDataDir, "xcdebugger");
      mkdirSync(debuggerDir, { recursive: true });

      const breakpointsXml = `<?xml version="1.0" encoding="UTF-8"?>
<Bucket
   uuid = "USER-BP-UUID"
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

      const userData = XCUserData.open(userDataDir);

      expect(userData.breakpoints).toBeDefined();
      expect(userData.breakpoints!.uuid).toBe("USER-BP-UUID");
    });

    it("saves breakpoints", () => {
      const userData = XCUserData.open(userDataDir);
      userData.breakpoints = {
        uuid: "NEW-USER-BP-UUID",
        type: "1",
        version: "2.0",
        breakpoints: [],
      };

      userData.saveBreakpoints();

      const breakpointsPath = path.join(
        userDataDir,
        "xcdebugger",
        "Breakpoints_v2.xcbkptlist"
      );
      expect(existsSync(breakpointsPath)).toBe(true);

      const content = readFileSync(breakpointsPath, "utf-8");
      expect(content).toContain('uuid = "NEW-USER-BP-UUID"');
    });
  });

  describe("save", () => {
    it("saves all modified data", () => {
      const userData = XCUserData.create("savetest");
      userData.filePath = userDataDir;

      userData.breakpoints = {
        uuid: "SAVE-TEST-UUID",
        type: "1",
        version: "2.0",
        breakpoints: [],
      };

      userData.schemeManagement = {
        SchemeUserState: {
          "SaveTest.xcscheme": {
            orderHint: 0,
          },
        },
      };

      userData.save();

      expect(
        existsSync(
          path.join(userDataDir, "xcdebugger", "Breakpoints_v2.xcbkptlist")
        )
      ).toBe(true);
      expect(
        existsSync(
          path.join(userDataDir, "xcschemes", "xcschememanagement.plist")
        )
      ).toBe(true);
    });

    it("saves to a new path when provided", () => {
      const newDir = path.join(tempDir, "newuser.xcuserdatad");

      const userData = XCUserData.create("newuser");
      userData.breakpoints = {
        uuid: "NEW-PATH-TEST-UUID",
        type: "1",
        version: "2.0",
        breakpoints: [],
      };

      userData.save(newDir);

      expect(userData.filePath).toBe(newDir);
      expect(
        existsSync(path.join(newDir, "xcdebugger", "Breakpoints_v2.xcbkptlist"))
      ).toBe(true);
    });

    it("throws when no path is set", () => {
      const userData = XCUserData.create("nopath");
      userData.breakpoints = {
        uuid: "TEST",
        type: "1",
        version: "2.0",
        breakpoints: [],
      };

      expect(() => {
        userData.save();
      }).toThrow("No file path specified");
    });
  });

  describe("lazy loading", () => {
    it("only loads breakpoints once", () => {
      const debuggerDir = path.join(userDataDir, "xcdebugger");
      mkdirSync(debuggerDir, { recursive: true });

      const breakpointsXml = `<?xml version="1.0" encoding="UTF-8"?>
<Bucket
   uuid = "LAZY-TEST-UUID"
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

      const userData = XCUserData.open(userDataDir);

      // Access twice
      const first = userData.breakpoints;
      const second = userData.breakpoints;

      // Should be the same object
      expect(first).toBe(second);
    });

    it("only loads scheme management once", () => {
      const schemesDir = path.join(userDataDir, "xcschemes");
      mkdirSync(schemesDir, { recursive: true });

      const managementPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>SchemeUserState</key>
	<dict>
	</dict>
</dict>
</plist>`;
      writeFileSync(
        path.join(schemesDir, "xcschememanagement.plist"),
        managementPlist
      );

      const userData = XCUserData.open(userDataDir);

      // Access twice
      const first = userData.schemeManagement;
      const second = userData.schemeManagement;

      // Should be the same object
      expect(first).toBe(second);
    });
  });
});
