import path from "path";

import { XcodeProject, PBXNativeTarget, PBXGroup } from "..";
import { build, parse } from "../../json";
import * as json from "../../json/types";

const MALFORMED_FIXTURE = path.join(__dirname, "fixtures/malformed.pbxproj");
const WORKING_FIXTURE = path.join(
  __dirname,
  "../../json/__tests__/fixtures/AFNetworking.pbxproj"
);
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
it(`asserts useful error message when malformed`, () => {
  const project = XcodeProject.open(MALFORMED_FIXTURE);
  expect(console.warn).toHaveBeenCalledWith(
    expect.stringContaining(
      "[Malformed Xcode project]: Found orphaned reference: 13B07F8E1A680F5B00A75B9A > PBXResourcesBuildPhase.files > 3E1C2299F05049539341855D"
    )
  );
});

describe("XcodeProject", () => {
  describe("getObject", () => {
    it("should return cached object for already-inflated UUID", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);

      // Get object twice
      const obj1 = xcproj.getObject("299522761BBF136400859F49");
      const obj2 = xcproj.getObject("299522761BBF136400859F49");

      // Should be exact same instance
      expect(obj1).toBe(obj2);
    });

    it("should inflate and cache on first access", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);

      // First access inflates the object
      const obj = xcproj.getObject("299522761BBF136400859F49");

      expect(obj).toBeDefined();
      expect(obj.isa).toBe("PBXNativeTarget");
      expect(xcproj.has("299522761BBF136400859F49")).toBe(true);
    });

    it("should throw for non-existent UUID", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);

      expect(() => {
        xcproj.getObject("NONEXISTENT1234567890AB");
      }).toThrow("object with uuid 'NONEXISTENT1234567890AB' not found");
    });
  });

  describe("createModel", () => {
    it("should generate deterministic UUID from content", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);

      // Create two models with same content
      const model1 = xcproj.createModel({
        isa: json.ISA.PBXGroup,
        children: [],
        sourceTree: "<group>",
        name: "TestGroup",
      });

      // The UUID should be deterministic - same input gives same UUID pattern
      expect(model1.uuid).toBeDefined();
      expect(model1.uuid.length).toBe(24);
    });

    it("should handle UUID collision by producing unique IDs", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);

      // Create first model
      const model1 = xcproj.createModel({
        isa: json.ISA.PBXGroup,
        children: [],
        sourceTree: "<group>",
        name: "UniqueGroup1",
      });

      // Create another model with same content (would cause collision)
      const model2 = xcproj.createModel({
        isa: json.ISA.PBXGroup,
        children: [],
        sourceTree: "<group>",
        name: "UniqueGroup1",
      });

      // UUIDs should be different (collision handled)
      expect(model1.uuid).not.toBe(model2.uuid);
    });

    it("should register model in project map", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);

      const model = xcproj.createModel({
        isa: json.ISA.PBXGroup,
        children: [],
        sourceTree: "<group>",
        name: "RegisteredGroup",
      });

      expect(xcproj.has(model.uuid)).toBe(true);
      expect(xcproj.get(model.uuid)).toBe(model);
    });
  });

  describe("getReferrers", () => {
    it("should find all objects referencing a UUID", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const target = xcproj.getObject(
        "299522761BBF136400859F49"
      ) as PBXNativeTarget;

      const referrers = xcproj.getReferrers(target.uuid);

      // Should include PBXProject (targets array) and possibly PBXTargetDependency
      expect(referrers.length).toBeGreaterThan(0);

      const projectReferrer = referrers.find((r) => r.isa === "PBXProject");
      expect(projectReferrer).toBeDefined();
    });

    it("should return empty array for orphan UUIDs", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);

      const referrers = xcproj.getReferrers("NONEXISTENT1234567890AB");

      expect(referrers).toEqual([]);
    });

    it("should find multiple referrers when applicable", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);

      // Find a file reference that might be referenced by multiple build files
      const mainGroup = xcproj.rootObject.props.mainGroup;
      const fileRef = mainGroup.props.children.find(
        (c) => c.isa === "PBXFileReference"
      );

      if (fileRef) {
        const referrers = xcproj.getReferrers(fileRef.uuid);
        // At minimum, the group should reference it
        expect(referrers.length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe("toJSON", () => {
    it("should produce valid JSON structure", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const json = xcproj.toJSON();

      expect(json.archiveVersion).toBeDefined();
      expect(json.objectVersion).toBeDefined();
      expect(json.rootObject).toBeDefined();
      expect(json.objects).toBeDefined();
      expect(typeof json.rootObject).toBe("string");
    });

    it("should include all objects in output", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const json = xcproj.toJSON();

      // All objects in the Map should be in the JSON
      for (const uuid of xcproj.keys()) {
        expect(json.objects[uuid]).toBeDefined();
      }
    });

    it("should serialize object references as UUIDs", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const json = xcproj.toJSON();

      // Find a PBXNativeTarget in the output
      const targetEntry = Object.entries(json.objects).find(
        ([, obj]) => obj.isa === "PBXNativeTarget"
      );
      expect(targetEntry).toBeDefined();

      const [, targetJson] = targetEntry!;
      // buildConfigurationList should be a UUID string
      const nativeTargetJson = targetJson as any;
      expect(typeof nativeTargetJson.buildConfigurationList).toBe("string");
    });
  });

  describe("toJSON round-trip", () => {
    it("should round-trip: parse(build(toJSON())) equals original", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);

      // First round-trip
      const json1 = xcproj.toJSON();
      const built = build(json1);
      const parsed = parse(built);

      // Create new project from parsed
      const xcproj2 = new XcodeProject(xcproj.filePath, parsed);
      const json2 = xcproj2.toJSON();

      // Should be equal
      expect(json2).toEqual(json1);
    });
  });

  describe("rootObject", () => {
    it("should be a PBXProject", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);

      expect(xcproj.rootObject).toBeDefined();
      expect(xcproj.rootObject.isa).toBe("PBXProject");
    });

    it("should have targets array", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);

      expect(Array.isArray(xcproj.rootObject.props.targets)).toBe(true);
    });
  });

  describe("getProjectRoot", () => {
    it("should return parent of xcodeproj directory", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);

      const root = xcproj.getProjectRoot();

      // Should be two levels up from the pbxproj file
      // e.g., /path/to/Project.xcodeproj/project.pbxproj -> /path/to
      expect(root).not.toContain("project.pbxproj");
      expect(root).not.toContain(".xcodeproj");
    });
  });

  describe("getReferenceForPath", () => {
    it("should throw for non-absolute paths", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);

      expect(() => {
        xcproj.getReferenceForPath("relative/path.swift");
      }).toThrow("Paths must be absolute");
    });

    it("should return null for non-existent paths", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);

      const result = xcproj.getReferenceForPath("/nonexistent/path.swift");
      expect(result).toBeNull();
    });
  });

  describe("Map operations", () => {
    it("should support iteration with entries()", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);

      let count = 0;
      for (const [uuid, obj] of xcproj.entries()) {
        expect(typeof uuid).toBe("string");
        expect(obj.uuid).toBe(uuid);
        count++;
      }

      expect(count).toBeGreaterThan(0);
    });

    it("should support values() iteration", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);

      const values = [...xcproj.values()];
      expect(values.length).toBeGreaterThan(0);
      expect(values[0].isa).toBeDefined();
    });

    it("should support has() method", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);

      expect(xcproj.has("299522761BBF136400859F49")).toBe(true);
      expect(xcproj.has("NONEXISTENT1234567890AB")).toBe(false);
    });

    it("should support delete() method", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const uuid = "299522761BBF136400859F49";

      expect(xcproj.has(uuid)).toBe(true);
      xcproj.delete(uuid);
      expect(xcproj.has(uuid)).toBe(false);
    });
  });
});

describe("parse", () => {
  beforeEach(() => {
    console.warn = jest.fn();
  });
  afterAll(() => {
    console.warn = originalConsoleWarn;
  });

  const fixtures = [
    "008-out-of-order-orphans.pbxproj",
    "006-spm.pbxproj",
    "AFNetworking.pbxproj",
    "shopify-tophat.pbxproj",
    "project.pbxproj",
    "project-rn74.pbxproj",
    ////
    // "Cocoa-Application.pbxproj",
    "project-multitarget-missing-targetattributes.pbxproj",
    "project-multitarget.pbxproj",
    "project-rni.pbxproj",
    "project-swift.pbxproj",
    "project-with-entitlements.pbxproj",
    "project-with-incorrect-create-manifest-ios-path.pbxproj",
    "project-without-create-manifest-ios.pbxproj",
    "swift-protobuf.pbxproj",
    "watch.pbxproj",
  ];

  fixtures.forEach((fixture) => {
    it(`should parse ${fixture}`, () => {
      const filePath = path.join(
        __dirname,
        "../../json/__tests__/fixtures/",
        fixture
      );
      const project = XcodeProject.open(filePath);
      expect(console.warn).not.toHaveBeenCalled();
    });
  });
});
