import path from "path";
import { XcodeProject, PBXNativeTarget } from "..";
import { PBXFileSystemSynchronizedRootGroup } from "../PBXFileSystemSynchronizedRootGroup";
import { PBXFileSystemSynchronizedBuildFileExceptionSet } from "../PBXFileSystemSynchronizedBuildFileExceptionSet";
import { loadFixture, expectRoundTrip } from "./test-utils";

const XCODE16_FIXTURE = path.join(
  __dirname,
  "../../json/__tests__/fixtures/007-xcode16.pbxproj"
);

const originalConsoleWarn = console.warn;
beforeEach(() => {
  console.warn = jest.fn();
});
afterAll(() => {
  console.warn = originalConsoleWarn;
});

describe("Xcode 16 Features", () => {
  describe("PBXFileSystemSynchronizedRootGroup", () => {
    it("should parse from fixture", () => {
      const xcproj = XcodeProject.open(XCODE16_FIXTURE);

      // Find a file system synchronized root group (Views)
      const viewsGroup = xcproj.getObject(
        "3E7D82792C3892F2006B36EB"
      ) as PBXFileSystemSynchronizedRootGroup;

      expect(viewsGroup).toBeDefined();
      expect(viewsGroup.isa).toBe("PBXFileSystemSynchronizedRootGroup");
      expect(viewsGroup.props.path).toBe("Views");
    });

    it("should serialize back correctly", () => {
      const xcproj = XcodeProject.open(XCODE16_FIXTURE);
      const viewsGroup = xcproj.getObject(
        "3E7D82792C3892F2006B36EB"
      ) as PBXFileSystemSynchronizedRootGroup;

      const json = viewsGroup.toJSON();

      expect(json.isa).toBe("PBXFileSystemSynchronizedRootGroup");
      expect(json.path).toBe("Views");
      expect(json.sourceTree).toBe("<group>");
    });

    it("should have exceptions array with inflated objects", () => {
      const xcproj = XcodeProject.open(XCODE16_FIXTURE);
      const viewsGroup = xcproj.getObject(
        "3E7D82792C3892F2006B36EB"
      ) as PBXFileSystemSynchronizedRootGroup;

      expect(viewsGroup.props.exceptions).toBeDefined();
      expect(viewsGroup.props.exceptions!.length).toBeGreaterThan(0);

      // Exceptions should be inflated objects
      for (const exception of viewsGroup.props.exceptions!) {
        expect(typeof exception).toBe("object");
        expect(exception.uuid).toBeDefined();
        expect(exception.isa).toBeDefined();
      }
    });

    it("should have correct static is() method", () => {
      const mockObj = { isa: "PBXFileSystemSynchronizedRootGroup" };
      expect(PBXFileSystemSynchronizedRootGroup.is(mockObj)).toBe(true);

      const wrongObj = { isa: "PBXGroup" };
      expect(PBXFileSystemSynchronizedRootGroup.is(wrongObj)).toBe(false);
    });

    it("should be referenced by mainGroup children", () => {
      const xcproj = XcodeProject.open(XCODE16_FIXTURE);
      const mainGroup = xcproj.rootObject.props.mainGroup;

      // File system synchronized groups should be in the main group hierarchy
      let foundSyncGroup = false;

      function findSyncGroups(children: any[]) {
        for (const child of children) {
          if (PBXFileSystemSynchronizedRootGroup.is(child)) {
            foundSyncGroup = true;
            return;
          }
          if (child.props?.children) {
            findSyncGroups(child.props.children);
          }
        }
      }

      findSyncGroups(mainGroup.props.children);
      expect(foundSyncGroup).toBe(true);
    });
  });

  describe("PBXFileSystemSynchronizedBuildFileExceptionSet", () => {
    it("should parse from fixture", () => {
      const xcproj = XcodeProject.open(XCODE16_FIXTURE);

      // Find an exception set
      const exceptionSet = xcproj.getObject(
        "3E7D827A2C3892FB006B36EB"
      ) as PBXFileSystemSynchronizedBuildFileExceptionSet;

      expect(exceptionSet).toBeDefined();
      expect(exceptionSet.isa).toBe(
        "PBXFileSystemSynchronizedBuildFileExceptionSet"
      );
    });

    it("should serialize back correctly", () => {
      const xcproj = XcodeProject.open(XCODE16_FIXTURE);
      const exceptionSet = xcproj.getObject(
        "3E7D827A2C3892FB006B36EB"
      ) as PBXFileSystemSynchronizedBuildFileExceptionSet;

      const json = exceptionSet.toJSON();

      expect(json.isa).toBe("PBXFileSystemSynchronizedBuildFileExceptionSet");
      expect(json.membershipExceptions).toBeDefined();
      expect(Array.isArray(json.membershipExceptions)).toBe(true);
    });

    it("should have membershipExceptions list", () => {
      const xcproj = XcodeProject.open(XCODE16_FIXTURE);
      const exceptionSet = xcproj.getObject(
        "3E7D827A2C3892FB006B36EB"
      ) as PBXFileSystemSynchronizedBuildFileExceptionSet;

      expect(exceptionSet.props.membershipExceptions).toBeDefined();
      expect(exceptionSet.props.membershipExceptions!.length).toBeGreaterThan(
        0
      );

      // Should include specific Swift files
      expect(exceptionSet.props.membershipExceptions).toContain(
        "GameListView.swift"
      );
    });

    it("should have inflated target reference", () => {
      const xcproj = XcodeProject.open(XCODE16_FIXTURE);
      const exceptionSet = xcproj.getObject(
        "3E7D827A2C3892FB006B36EB"
      ) as PBXFileSystemSynchronizedBuildFileExceptionSet;

      expect(exceptionSet.props.target).toBeDefined();
      expect(typeof exceptionSet.props.target).toBe("object");
      expect(exceptionSet.props.target.uuid).toBeDefined();
    });

    it("should have correct static is() method", () => {
      const mockObj = { isa: "PBXFileSystemSynchronizedBuildFileExceptionSet" };
      expect(PBXFileSystemSynchronizedBuildFileExceptionSet.is(mockObj)).toBe(
        true
      );

      const wrongObj = { isa: "PBXGroup" };
      expect(PBXFileSystemSynchronizedBuildFileExceptionSet.is(wrongObj)).toBe(
        false
      );
    });
  });

  describe("exception sets and target relationships", () => {
    it("should have target reference pointing to native target", () => {
      const xcproj = XcodeProject.open(XCODE16_FIXTURE);

      // Find the main target
      const target = xcproj.getObject(
        "3E7D82632C3892C4006B36EB"
      ) as PBXNativeTarget;

      expect(target).toBeDefined();
      expect(target.isa).toBe("PBXNativeTarget");
      expect(target.props.name).toBe("ScoreTally");
    });

    it("should have exception sets referencing the target", () => {
      const xcproj = XcodeProject.open(XCODE16_FIXTURE);
      const target = xcproj.getObject(
        "3E7D82632C3892C4006B36EB"
      ) as PBXNativeTarget;

      // Find exception sets that reference this target
      const exceptionSets: PBXFileSystemSynchronizedBuildFileExceptionSet[] =
        [];
      for (const obj of xcproj.values()) {
        if (PBXFileSystemSynchronizedBuildFileExceptionSet.is(obj)) {
          if (obj.props.target.uuid === target.uuid) {
            exceptionSets.push(obj);
          }
        }
      }

      expect(exceptionSets.length).toBeGreaterThan(0);
    });
  });

  describe("round-trip", () => {
    it("should round-trip Xcode 16 features correctly", () => {
      const xcproj = loadFixture("007-xcode16.pbxproj");
      expectRoundTrip(xcproj);
    });

    it("should preserve file system synchronized groups", () => {
      const xcproj = XcodeProject.open(XCODE16_FIXTURE);

      // Get original structure
      const originalViewsGroup = xcproj.getObject(
        "3E7D82792C3892F2006B36EB"
      ) as PBXFileSystemSynchronizedRootGroup;
      const originalPath = originalViewsGroup.props.path;
      const originalExceptionCount = originalViewsGroup.props.exceptions!.length;

      // Round-trip
      expectRoundTrip(xcproj);

      // Verify after
      const viewsGroup = xcproj.getObject(
        "3E7D82792C3892F2006B36EB"
      ) as PBXFileSystemSynchronizedRootGroup;
      expect(viewsGroup.props.path).toBe(originalPath);
      expect(viewsGroup.props.exceptions!.length).toBe(originalExceptionCount);
    });

    it("should preserve exception sets with membership exceptions", () => {
      const xcproj = XcodeProject.open(XCODE16_FIXTURE);

      const exceptionSet = xcproj.getObject(
        "3E7D827A2C3892FB006B36EB"
      ) as PBXFileSystemSynchronizedBuildFileExceptionSet;
      const originalExceptions = [
        ...exceptionSet.props.membershipExceptions!,
      ];

      expectRoundTrip(xcproj);

      const exceptionSetAfter = xcproj.getObject(
        "3E7D827A2C3892FB006B36EB"
      ) as PBXFileSystemSynchronizedBuildFileExceptionSet;
      expect(exceptionSetAfter.props.membershipExceptions).toEqual(
        originalExceptions
      );
    });
  });

  describe("integration", () => {
    it("should find all Xcode 16 specific object types", () => {
      const xcproj = XcodeProject.open(XCODE16_FIXTURE);

      const syncRootGroups: PBXFileSystemSynchronizedRootGroup[] = [];
      const exceptionSets: PBXFileSystemSynchronizedBuildFileExceptionSet[] = [];

      for (const obj of xcproj.values()) {
        if (PBXFileSystemSynchronizedRootGroup.is(obj)) {
          syncRootGroups.push(obj);
        } else if (PBXFileSystemSynchronizedBuildFileExceptionSet.is(obj)) {
          exceptionSets.push(obj);
        }
      }

      // Should have multiple of each
      expect(syncRootGroups.length).toBeGreaterThan(0);
      expect(exceptionSets.length).toBeGreaterThan(0);
    });

    it("should maintain correct reference chain: groups -> exceptions -> target", () => {
      const xcproj = XcodeProject.open(XCODE16_FIXTURE);

      const target = xcproj.getObject(
        "3E7D82632C3892C4006B36EB"
      ) as PBXNativeTarget;

      // Find all file system synchronized root groups
      const syncGroups: PBXFileSystemSynchronizedRootGroup[] = [];
      for (const obj of xcproj.values()) {
        if (PBXFileSystemSynchronizedRootGroup.is(obj)) {
          syncGroups.push(obj);
        }
      }

      expect(syncGroups.length).toBeGreaterThan(0);

      // Each group's exceptions should reference the target
      for (const syncGroup of syncGroups) {
        if (syncGroup.props.exceptions) {
          for (const exception of syncGroup.props.exceptions) {
            if (PBXFileSystemSynchronizedBuildFileExceptionSet.is(exception)) {
              expect(exception.props.target.uuid).toBe(target.uuid);
            }
          }
        }
      }
    });

    it("should serialize all Xcode 16 objects in project toJSON", () => {
      const xcproj = XcodeProject.open(XCODE16_FIXTURE);
      const json = xcproj.toJSON();

      // Views group
      expect(json.objects["3E7D82792C3892F2006B36EB"]).toBeDefined();
      expect(json.objects["3E7D82792C3892F2006B36EB"].isa).toBe(
        "PBXFileSystemSynchronizedRootGroup"
      );

      // Exception set
      expect(json.objects["3E7D827A2C3892FB006B36EB"]).toBeDefined();
      expect(json.objects["3E7D827A2C3892FB006B36EB"].isa).toBe(
        "PBXFileSystemSynchronizedBuildFileExceptionSet"
      );
    });
  });
});
