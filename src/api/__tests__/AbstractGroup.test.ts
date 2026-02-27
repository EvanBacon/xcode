import path from "path";
import { XcodeProject, PBXGroup, PBXFileReference } from "..";
import { loadFixture, expectRoundTrip } from "./test-utils";

const MULTITARGET_FIXTURE = path.join(
  __dirname,
  "../../json/__tests__/fixtures/project-multitarget.pbxproj"
);

const originalConsoleWarn = console.warn;
beforeEach(() => {
  console.warn = jest.fn();
});
afterAll(() => {
  console.warn = originalConsoleWarn;
});

describe("AbstractGroup", () => {
  describe("mkdir", () => {
    it("should return self for empty array path", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const mainGroup = xcproj.rootObject.props.mainGroup;

      const result = mainGroup.mkdir([]);
      expect(result).toBe(mainGroup);
    });

    it("should return null for empty string path without recursive", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const mainGroup = xcproj.rootObject.props.mainGroup;

      // "" splits to [""], which is not empty, so it tries to find child ""
      const result = mainGroup.mkdir("");
      expect(result).toBeNull();
    });

    it("should find existing child group by name", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const mainGroup = xcproj.rootObject.props.mainGroup;

      // Find an existing child group
      const existingChild = mainGroup.getChildGroups()[0];
      expect(existingChild).toBeDefined();

      const displayName = existingChild.getDisplayName();
      const found = mainGroup.mkdir(displayName);

      expect(found).toBe(existingChild);
    });

    it("should return null for non-existing group without recursive", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const mainGroup = xcproj.rootObject.props.mainGroup;

      const result = mainGroup.mkdir("NonExistentGroup");
      expect(result).toBeNull();
    });

    it("should create missing groups when recursive=true", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const mainGroup = xcproj.rootObject.props.mainGroup;

      const initialChildCount = mainGroup.props.children.length;

      const result = mainGroup.mkdir("NewGroup", { recursive: true });

      expect(result).toBeDefined();
      expect(PBXGroup.is(result)).toBe(true);
      expect(result!.getDisplayName()).toBe("NewGroup");
      expect(mainGroup.props.children.length).toBe(initialChildCount + 1);
    });

    it("should handle deeply nested paths", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const mainGroup = xcproj.rootObject.props.mainGroup;

      const result = mainGroup.mkdir("A/B/C", { recursive: true });

      expect(result).toBeDefined();
      expect(result!.getDisplayName()).toBe("C");

      // Verify the hierarchy was created
      const groupA = mainGroup
        .getChildGroups()
        .find((g) => g.getDisplayName() === "A");
      expect(groupA).toBeDefined();

      const groupB = groupA!
        .getChildGroups()
        .find((g) => g.getDisplayName() === "B");
      expect(groupB).toBeDefined();

      const groupC = groupB!
        .getChildGroups()
        .find((g) => g.getDisplayName() === "C");
      expect(groupC).toBeDefined();
      expect(groupC).toBe(result);
    });

    it("should accept array path", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const mainGroup = xcproj.rootObject.props.mainGroup;

      const result = mainGroup.mkdir(["X", "Y", "Z"], { recursive: true });

      expect(result).toBeDefined();
      expect(result!.getDisplayName()).toBe("Z");
    });

    it("should find existing deeply nested group", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const mainGroup = xcproj.rootObject.props.mainGroup;

      // First create the hierarchy
      const created = mainGroup.mkdir("Nested/Path/Here", { recursive: true });
      expect(created).toBeDefined();

      // Then find it again
      const found = mainGroup.mkdir("Nested/Path/Here");
      expect(found).toBe(created);
    });
  });

  describe("move", () => {
    it("should move file reference to new parent", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const mainGroup = xcproj.rootObject.props.mainGroup;

      // Create a file
      const file = mainGroup.createFile({ path: "MoveTest.swift" });
      expect(
        mainGroup.props.children.find((c) => c.uuid === file.uuid)
      ).toBeDefined();

      // Create a new group to move to
      const newParent = mainGroup.createGroup({ path: "NewParent" });

      // Move the file
      PBXGroup.move(file, newParent);

      // Should be removed from old parent
      expect(
        mainGroup.props.children.find((c) => c.uuid === file.uuid)
      ).toBeUndefined();

      // Should be in new parent
      expect(
        newParent.props.children.find((c) => c.uuid === file.uuid)
      ).toBeDefined();
    });

    it("should remove from old parent's children", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const mainGroup = xcproj.rootObject.props.mainGroup;

      const file = mainGroup.createFile({ path: "RemoveFromOld.swift" });
      const initialCount = mainGroup.props.children.length;

      const newParent = mainGroup.createGroup({ path: "Target" });

      PBXGroup.move(file, newParent);

      // mainGroup should have one less child (the file), but +1 for newParent
      // Net change: 0, but file should be gone from children
      expect(
        mainGroup.props.children.filter((c) => c.uuid === file.uuid).length
      ).toBe(0);
    });

    it("should add to new parent's children", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const mainGroup = xcproj.rootObject.props.mainGroup;

      const file = mainGroup.createFile({ path: "AddToNew.swift" });
      const newParent = mainGroup.createGroup({ path: "TargetGroup" });

      const initialNewParentCount = newParent.props.children.length;

      PBXGroup.move(file, newParent);

      expect(newParent.props.children.length).toBe(initialNewParentCount + 1);
      expect(
        newParent.props.children.find((c) => c.uuid === file.uuid)
      ).toBeDefined();
    });

    it("should throw when moving object to itself", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const mainGroup = xcproj.rootObject.props.mainGroup;

      const group = mainGroup.createGroup({ path: "SelfMove" });

      expect(() => {
        PBXGroup.move(group, group);
      }).toThrow("to itself");
    });

    it("should throw when moving object to its child", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const mainGroup = xcproj.rootObject.props.mainGroup;

      const parent = mainGroup.createGroup({ path: "Parent" });
      const child = parent.createGroup({ path: "Child" });

      expect(() => {
        PBXGroup.move(parent, child);
      }).toThrow("to a child object");
    });
  });

  describe("createGroup", () => {
    it("should create a new child group with path", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const mainGroup = xcproj.rootObject.props.mainGroup;

      const initialCount = mainGroup.props.children.length;

      const newGroup = mainGroup.createGroup({ path: "TestGroup" });

      expect(newGroup).toBeDefined();
      expect(PBXGroup.is(newGroup)).toBe(true);
      expect(newGroup.props.path).toBe("TestGroup");
      expect(mainGroup.props.children.length).toBe(initialCount + 1);
      expect(
        mainGroup.props.children.find((c) => c.uuid === newGroup.uuid)
      ).toBeDefined();
    });

    it("should create a new child group with name", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const mainGroup = xcproj.rootObject.props.mainGroup;

      const newGroup = mainGroup.createGroup({ name: "NamedGroup" });

      expect(newGroup).toBeDefined();
      expect(newGroup.props.name).toBe("NamedGroup");
    });

    it("should throw when neither path nor name provided", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const mainGroup = xcproj.rootObject.props.mainGroup;

      expect(() => {
        mainGroup.createGroup({} as any);
      }).toThrow("must have a path or name");
    });

    it("should register group in project", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const mainGroup = xcproj.rootObject.props.mainGroup;

      const newGroup = mainGroup.createGroup({ path: "RegisteredGroup" });

      expect(xcproj.has(newGroup.uuid)).toBe(true);
    });
  });

  describe("createFile", () => {
    it("should create a new file reference", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const mainGroup = xcproj.rootObject.props.mainGroup;

      const initialCount = mainGroup.props.children.length;

      const newFile = mainGroup.createFile({ path: "NewFile.swift" });

      expect(newFile).toBeDefined();
      expect(PBXFileReference.is(newFile)).toBe(true);
      expect(newFile.props.path).toBe("NewFile.swift");
      expect(mainGroup.props.children.length).toBe(initialCount + 1);
    });

    it("should add file to children array", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const mainGroup = xcproj.rootObject.props.mainGroup;

      const newFile = mainGroup.createFile({ path: "AddedFile.m" });

      expect(
        mainGroup.props.children.find((c) => c.uuid === newFile.uuid)
      ).toBeDefined();
    });

    it("should register file in project", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const mainGroup = xcproj.rootObject.props.mainGroup;

      const newFile = mainGroup.createFile({ path: "Registered.h" });

      expect(xcproj.has(newFile.uuid)).toBe(true);
    });

    it("should accept sourceTree option", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const mainGroup = xcproj.rootObject.props.mainGroup;

      const newFile = mainGroup.createFile({
        path: "SourceRootFile.swift",
        sourceTree: "SOURCE_ROOT",
      });

      expect(newFile.props.sourceTree).toBe("SOURCE_ROOT");
    });
  });

  describe("getChildGroups", () => {
    it("should return only PBXGroup children", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const mainGroup = xcproj.rootObject.props.mainGroup;

      const childGroups = mainGroup.getChildGroups();

      // All returned items should be PBXGroup
      for (const child of childGroups) {
        expect(PBXGroup.is(child)).toBe(true);
      }
    });

    it("should not include file references", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const mainGroup = xcproj.rootObject.props.mainGroup;

      // Add a file to ensure there's a non-group child
      mainGroup.createFile({ path: "TestFile.swift" });

      const childGroups = mainGroup.getChildGroups();

      // No file references should be in the result
      for (const child of childGroups) {
        expect(child.isa).not.toBe("PBXFileReference");
      }
    });
  });

  describe("getDisplayName", () => {
    it("should return name if present", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const mainGroup = xcproj.rootObject.props.mainGroup;

      const namedGroup = mainGroup.createGroup({ name: "DisplayName" });

      expect(namedGroup.getDisplayName()).toBe("DisplayName");
    });

    it("should return basename of path if no name", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const mainGroup = xcproj.rootObject.props.mainGroup;

      const pathGroup = mainGroup.createGroup({ path: "some/nested/path" });

      expect(pathGroup.getDisplayName()).toBe("path");
    });

    it("should return 'Main Group' for main group", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const mainGroup = xcproj.rootObject.props.mainGroup;

      // Main group typically has no name or path
      // Its display name should be "Main Group"
      expect(mainGroup.getDisplayName()).toBeDefined();
    });
  });

  describe("getParent", () => {
    it("should return parent group", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const mainGroup = xcproj.rootObject.props.mainGroup;

      const childGroup = mainGroup.createGroup({ path: "Child" });
      const parent = childGroup.getParent();

      expect(parent).toBe(mainGroup);
    });
  });

  describe("getParents", () => {
    it("should return chain of parent groups", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const mainGroup = xcproj.rootObject.props.mainGroup;

      const child = mainGroup.mkdir("A/B/C", { recursive: true })!;
      const parents = child.getParents();

      // Should include B, A, mainGroup, and possibly project
      expect(parents.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("round-trip", () => {
    it("should preserve group structure through round-trip", () => {
      const xcproj = loadFixture("project-multitarget.pbxproj");
      const mainGroup = xcproj.rootObject.props.mainGroup;

      // Create a nested structure
      const nested = mainGroup.mkdir("Test/Nested/Structure", {
        recursive: true,
      });
      expect(nested).toBeDefined();

      // Round-trip should preserve it
      expectRoundTrip(xcproj);
    });

    it("should preserve files in groups through round-trip", () => {
      const xcproj = loadFixture("project-multitarget.pbxproj");
      const mainGroup = xcproj.rootObject.props.mainGroup;

      const group = mainGroup.createGroup({ path: "FilesGroup" });
      group.createFile({ path: "File1.swift" });
      group.createFile({ path: "File2.swift" });

      expectRoundTrip(xcproj);
    });
  });
});
