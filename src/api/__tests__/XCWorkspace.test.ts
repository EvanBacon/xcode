import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import path from "path";
import tempy from "tempy";

import { XCWorkspace } from "../XCWorkspace";

describe("XCWorkspace", () => {
  describe("create", () => {
    it("creates empty workspace with defaults", () => {
      const workspace = XCWorkspace.create("MyWorkspace");

      expect(workspace.name).toBe("MyWorkspace");
      expect(workspace.props.version).toBe("1.0");
      expect(workspace.props.fileRefs).toEqual([]);
    });

    it("creates workspace with custom props", () => {
      const workspace = XCWorkspace.create("MyWorkspace", {
        fileRefs: [{ location: "group:App.xcodeproj" }],
      });

      expect(workspace.props.fileRefs).toHaveLength(1);
      expect(workspace.props.fileRefs![0].location).toBe("group:App.xcodeproj");
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

    it("opens workspace from directory", () => {
      const workspacePath = path.join(tempDir, "Test.xcworkspace");
      mkdirSync(workspacePath, { recursive: true });
      writeFileSync(
        path.join(workspacePath, "contents.xcworkspacedata"),
        `<?xml version="1.0" encoding="UTF-8"?>
<Workspace
   version = "1.0">
   <FileRef
      location = "group:App.xcodeproj">
   </FileRef>
</Workspace>
`
      );

      const workspace = XCWorkspace.open(workspacePath);

      expect(workspace.name).toBe("Test");
      expect(workspace.props.version).toBe("1.0");
      expect(workspace.props.fileRefs).toHaveLength(1);
      expect(workspace.filePath).toBe(workspacePath);
    });

    it("throws on invalid path", () => {
      expect(() => XCWorkspace.open("/nonexistent/path.xcworkspace")).toThrow(
        "Invalid workspace"
      );
    });

    it("throws on missing contents.xcworkspacedata", () => {
      const workspacePath = path.join(tempDir, "Empty.xcworkspace");
      mkdirSync(workspacePath, { recursive: true });

      expect(() => XCWorkspace.open(workspacePath)).toThrow("Invalid workspace");
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

    it("saves workspace to disk", () => {
      const workspace = XCWorkspace.create("Test");
      workspace.addProject("App.xcodeproj");

      const workspacePath = path.join(tempDir, "Test.xcworkspace");
      workspace.save(workspacePath);

      expect(existsSync(workspacePath)).toBe(true);
      expect(
        existsSync(path.join(workspacePath, "contents.xcworkspacedata"))
      ).toBe(true);

      const content = readFileSync(
        path.join(workspacePath, "contents.xcworkspacedata"),
        "utf-8"
      );
      expect(content).toContain('location = "group:App.xcodeproj"');
    });

    it("throws when no path specified and filePath not set", () => {
      const workspace = XCWorkspace.create("Test");
      expect(() => workspace.save()).toThrow("No file path specified");
    });

    it("uses filePath when no argument provided", () => {
      const workspacePath = path.join(tempDir, "Test.xcworkspace");
      mkdirSync(workspacePath, { recursive: true });
      writeFileSync(
        path.join(workspacePath, "contents.xcworkspacedata"),
        `<?xml version="1.0" encoding="UTF-8"?>
<Workspace version = "1.0"></Workspace>
`
      );

      const workspace = XCWorkspace.open(workspacePath);
      workspace.addProject("NewProject.xcodeproj");
      workspace.save();

      const content = readFileSync(
        path.join(workspacePath, "contents.xcworkspacedata"),
        "utf-8"
      );
      expect(content).toContain('location = "group:NewProject.xcodeproj"');
    });
  });

  describe("addProject", () => {
    it("adds project with default group location", () => {
      const workspace = XCWorkspace.create("Test");
      workspace.addProject("App.xcodeproj");

      expect(workspace.props.fileRefs).toHaveLength(1);
      expect(workspace.props.fileRefs![0].location).toBe("group:App.xcodeproj");
    });

    it("adds project with custom location type", () => {
      const workspace = XCWorkspace.create("Test");
      workspace.addProject("/path/to/App.xcodeproj", "absolute");

      expect(workspace.props.fileRefs![0].location).toBe(
        "absolute:/path/to/App.xcodeproj"
      );
    });

    it("does not add duplicate projects", () => {
      const workspace = XCWorkspace.create("Test");
      workspace.addProject("App.xcodeproj");
      workspace.addProject("App.xcodeproj");

      expect(workspace.props.fileRefs).toHaveLength(1);
    });

    it("adds multiple different projects", () => {
      const workspace = XCWorkspace.create("Test");
      workspace.addProject("App.xcodeproj");
      workspace.addProject("Pods/Pods.xcodeproj");

      expect(workspace.props.fileRefs).toHaveLength(2);
    });
  });

  describe("removeProject", () => {
    it("removes project by full location", () => {
      const workspace = XCWorkspace.create("Test");
      workspace.addProject("App.xcodeproj");
      workspace.addProject("Other.xcodeproj");

      const result = workspace.removeProject("group:App.xcodeproj");

      expect(result).toBe(true);
      expect(workspace.props.fileRefs).toHaveLength(1);
      expect(workspace.props.fileRefs![0].location).toBe("group:Other.xcodeproj");
    });

    it("removes project by path only", () => {
      const workspace = XCWorkspace.create("Test");
      workspace.addProject("App.xcodeproj");

      const result = workspace.removeProject("App.xcodeproj");

      expect(result).toBe(true);
      expect(workspace.props.fileRefs).toHaveLength(0);
    });

    it("returns false when project not found", () => {
      const workspace = XCWorkspace.create("Test");
      workspace.addProject("App.xcodeproj");

      const result = workspace.removeProject("Nonexistent.xcodeproj");

      expect(result).toBe(false);
      expect(workspace.props.fileRefs).toHaveLength(1);
    });
  });

  describe("hasProject", () => {
    it("returns true for existing project", () => {
      const workspace = XCWorkspace.create("Test");
      workspace.addProject("App.xcodeproj");

      expect(workspace.hasProject("App.xcodeproj")).toBe(true);
      expect(workspace.hasProject("group:App.xcodeproj")).toBe(true);
    });

    it("returns false for non-existing project", () => {
      const workspace = XCWorkspace.create("Test");

      expect(workspace.hasProject("App.xcodeproj")).toBe(false);
    });
  });

  describe("getProjectPaths", () => {
    it("returns all project paths", () => {
      const workspace = XCWorkspace.create("Test");
      workspace.addProject("App.xcodeproj");
      workspace.addProject("Pods/Pods.xcodeproj");

      const paths = workspace.getProjectPaths();

      expect(paths).toEqual([
        "group:App.xcodeproj",
        "group:Pods/Pods.xcodeproj",
      ]);
    });

    it("includes paths from groups", () => {
      const workspace = XCWorkspace.create("Test");
      workspace.addProject("App.xcodeproj");

      const group = workspace.addGroup("Libraries", "group:Libraries");
      group.fileRefs = [{ location: "group:Lib.xcodeproj" }];

      const paths = workspace.getProjectPaths();

      expect(paths).toContain("group:App.xcodeproj");
      expect(paths).toContain("group:Lib.xcodeproj");
    });

    it("returns empty array for empty workspace", () => {
      const workspace = XCWorkspace.create("Test", { fileRefs: undefined });

      const paths = workspace.getProjectPaths();

      expect(paths).toEqual([]);
    });
  });

  describe("groups", () => {
    it("adds a group", () => {
      const workspace = XCWorkspace.create("Test");
      const group = workspace.addGroup("Libraries", "group:Libraries");

      expect(group.name).toBe("Libraries");
      expect(group.location).toBe("group:Libraries");
      expect(workspace.props.groups).toHaveLength(1);
    });

    it("returns existing group if already exists", () => {
      const workspace = XCWorkspace.create("Test");
      const group1 = workspace.addGroup("Libraries", "group:Libraries");
      const group2 = workspace.addGroup("Libraries", "group:Libraries");

      expect(group1).toBe(group2);
      expect(workspace.props.groups).toHaveLength(1);
    });

    it("gets a group by name", () => {
      const workspace = XCWorkspace.create("Test");
      workspace.addGroup("Libraries");

      const group = workspace.getGroup("Libraries");

      expect(group).toBeDefined();
      expect(group!.name).toBe("Libraries");
    });

    it("returns undefined for non-existing group", () => {
      const workspace = XCWorkspace.create("Test");

      expect(workspace.getGroup("Nonexistent")).toBeUndefined();
    });

    it("removes a group", () => {
      const workspace = XCWorkspace.create("Test");
      workspace.addGroup("Libraries");

      const result = workspace.removeGroup("Libraries");

      expect(result).toBe(true);
      expect(workspace.props.groups).toHaveLength(0);
    });

    it("returns false when removing non-existing group", () => {
      const workspace = XCWorkspace.create("Test");

      const result = workspace.removeGroup("Nonexistent");

      expect(result).toBe(false);
    });
  });

  describe("toXML", () => {
    it("returns XML representation", () => {
      const workspace = XCWorkspace.create("Test");
      workspace.addProject("App.xcodeproj");

      const xml = workspace.toXML();

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain("<Workspace");
      expect(xml).toContain('location = "group:App.xcodeproj"');
    });
  });

  describe("equality", () => {
    it("equal workspaces have equal props", () => {
      const ws1 = XCWorkspace.create("Test");
      ws1.addProject("App.xcodeproj");

      const ws2 = XCWorkspace.create("Test");
      ws2.addProject("App.xcodeproj");

      expect(ws1.props).toEqual(ws2.props);
    });

    it("unequal workspaces have different props", () => {
      const ws1 = XCWorkspace.create("Test");
      ws1.addProject("App.xcodeproj");

      const ws2 = XCWorkspace.create("Test");
      ws2.addProject("Other.xcodeproj");

      expect(ws1.props).not.toEqual(ws2.props);
    });
  });
});
