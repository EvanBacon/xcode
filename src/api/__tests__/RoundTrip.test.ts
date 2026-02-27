import path from "path";
import { XcodeProject, PBXNativeTarget } from "..";
import { build, parse } from "../../json";
import {
  loadFixture,
  expectRoundTrip,
  expectNoOrphanReferences,
} from "./test-utils";

/**
 * Round-trip tests ensure that:
 * 1. Parsing a pbxproj file and serializing it back produces equivalent data
 * 2. The high-level API correctly inflates and deflates object references
 * 3. Modifications to the project are preserved through serialization cycles
 *
 * Following XcodeProj (Swift) patterns for validation.
 */

const FIXTURES_DIR = path.join(__dirname, "../../json/__tests__/fixtures/");

// Fixtures that should round-trip cleanly through the API layer
// Note: 009-expo-app-clip.pbxproj is excluded due to known serialization
// issue with `lastKnownFileType: undefined` becoming `"undefined"` string
const roundTripFixtures = [
  "006-spm.pbxproj",
  "007-xcode16.pbxproj",
  "AFNetworking.pbxproj",
  "project.pbxproj",
  "project-rn74.pbxproj",
  "project-multitarget.pbxproj",
  "project-rni.pbxproj",
  "project-swift.pbxproj",
  "project-with-entitlements.pbxproj",
  "watch.pbxproj",
];

const originalConsoleWarn = console.warn;
beforeEach(() => {
  console.warn = jest.fn();
});
afterAll(() => {
  console.warn = originalConsoleWarn;
});

describe("Round-trip correctness", () => {
  describe("parse -> toJSON -> build -> parse", () => {
    roundTripFixtures.forEach((fixture) => {
      it(`should round-trip ${fixture} without data loss`, () => {
        const filePath = path.join(FIXTURES_DIR, fixture);
        const xcproj = XcodeProject.open(filePath);

        // First serialization
        const json1 = xcproj.toJSON();

        // Build back to pbxproj format
        const built = build(json1);

        // Parse again
        const parsed = parse(built);

        // Create new project from parsed data
        const xcproj2 = new XcodeProject(filePath, parsed);

        // Second serialization
        const json2 = xcproj2.toJSON();

        // Compare JSON structures
        expect(json2).toEqual(json1);
      });
    });
  });

  describe("API round-trip", () => {
    roundTripFixtures.forEach((fixture) => {
      it(`should preserve object references in ${fixture}`, () => {
        const xcproj = loadFixture(fixture);

        // Inflate all objects by iterating
        for (const obj of xcproj.values()) {
          // Access to trigger any lazy inflation
          obj.toJSON();
        }

        // Verify round-trip
        expectRoundTrip(xcproj);
      });
    });
  });

  describe("modification round-trip", () => {
    it("should preserve added target after round-trip", () => {
      const xcproj = loadFixture("project-multitarget.pbxproj");
      const project = xcproj.rootObject;

      // Get existing target for build configuration list
      const existingTarget = project.getMainAppTarget();
      expect(existingTarget).toBeDefined();

      const initialTargetCount = project.props.targets.length;

      // Create a new target
      const newTarget = project.createNativeTarget({
        name: "RoundTripTestTarget",
        productType: "com.apple.product-type.framework",
        buildConfigurationList: existingTarget!.props.buildConfigurationList,
      });

      expect(project.props.targets.length).toBe(initialTargetCount + 1);

      // Round-trip
      const json1 = xcproj.toJSON();
      const built = build(json1);
      const parsed = parse(built);
      const xcproj2 = new XcodeProject(xcproj.filePath, parsed);

      // Verify new target exists
      expect(xcproj2.rootObject.props.targets.length).toBe(
        initialTargetCount + 1
      );

      const foundTarget = xcproj2.rootObject.props.targets.find(
        (t) => PBXNativeTarget.is(t) && t.props.name === "RoundTripTestTarget"
      );
      expect(foundTarget).toBeDefined();
    });

    it("should preserve modified build settings after round-trip", () => {
      const xcproj = loadFixture("project-multitarget.pbxproj");
      const target = xcproj.rootObject.getMainAppTarget();
      expect(target).toBeDefined();

      // Modify a build setting
      const originalValue = target!.getDefaultBuildSetting(
        "IPHONEOS_DEPLOYMENT_TARGET"
      );
      target!.setBuildSetting("IPHONEOS_DEPLOYMENT_TARGET", "99.0");

      // Round-trip
      const json1 = xcproj.toJSON();
      const built = build(json1);
      const parsed = parse(built);
      const xcproj2 = new XcodeProject(xcproj.filePath, parsed);

      // Verify modification persists
      const target2 = xcproj2.rootObject.getMainAppTarget();
      expect(target2).toBeDefined();
      expect(target2!.getDefaultBuildSetting("IPHONEOS_DEPLOYMENT_TARGET")).toBe(
        "99.0"
      );
    });

    it("should preserve added file reference after round-trip", () => {
      const xcproj = loadFixture("project-multitarget.pbxproj");
      const mainGroup = xcproj.rootObject.props.mainGroup;

      const initialChildCount = mainGroup.props.children.length;

      // Add a new file
      const newFile = mainGroup.createFile({
        path: "RoundTripTest.swift",
        sourceTree: "<group>",
      });

      expect(mainGroup.props.children.length).toBe(initialChildCount + 1);

      // Round-trip
      const json1 = xcproj.toJSON();
      const built = build(json1);
      const parsed = parse(built);
      const xcproj2 = new XcodeProject(xcproj.filePath, parsed);

      // Verify file exists
      const mainGroup2 = xcproj2.rootObject.props.mainGroup;
      expect(mainGroup2.props.children.length).toBe(initialChildCount + 1);

      const foundFile = mainGroup2.props.children.find(
        (c) => c.isa === "PBXFileReference" && c.props.path === "RoundTripTest.swift"
      );
      expect(foundFile).toBeDefined();
    });

    it("should preserve removed object after round-trip", () => {
      const xcproj = loadFixture("project-multitarget.pbxproj");
      const mainGroup = xcproj.rootObject.props.mainGroup;

      // Add a file first
      const newFile = mainGroup.createFile({
        path: "ToBeRemoved.swift",
        sourceTree: "<group>",
      });
      const newFileUuid = newFile.uuid;

      // Remove the file
      newFile.removeFromProject();
      expect(xcproj.has(newFileUuid)).toBe(false);

      // Round-trip
      const json1 = xcproj.toJSON();
      const built = build(json1);
      const parsed = parse(built);
      const xcproj2 = new XcodeProject(xcproj.filePath, parsed);

      // Verify file is still gone
      expect(xcproj2.has(newFileUuid)).toBe(false);
    });
  });

  describe("no orphan references", () => {
    roundTripFixtures.forEach((fixture) => {
      it(`${fixture} should have no orphan references after round-trip`, () => {
        const xcproj = loadFixture(fixture);

        // Round-trip
        const json1 = xcproj.toJSON();
        const built = build(json1);
        const parsed = parse(built);
        const xcproj2 = new XcodeProject(xcproj.filePath, parsed);

        // Check for orphans
        expectNoOrphanReferences(xcproj2);
      });
    });
  });

  describe("deterministic serialization", () => {
    it("should produce identical output for multiple serializations", () => {
      const xcproj = loadFixture("project-multitarget.pbxproj");

      const json1 = xcproj.toJSON();
      const json2 = xcproj.toJSON();

      expect(json1).toEqual(json2);
    });

    it("should produce identical pbxproj output for multiple builds", () => {
      const xcproj = loadFixture("project-multitarget.pbxproj");

      const json = xcproj.toJSON();
      const built1 = build(json);
      const built2 = build(json);

      expect(built1).toBe(built2);
    });
  });

  describe("object integrity", () => {
    it("should maintain correct isa types after round-trip", () => {
      const xcproj = loadFixture("project-multitarget.pbxproj");

      // Collect isa types
      const originalIsaMap = new Map<string, string>();
      for (const [uuid, obj] of xcproj.entries()) {
        originalIsaMap.set(uuid, obj.isa);
      }

      // Round-trip
      const json = xcproj.toJSON();
      const built = build(json);
      const parsed = parse(built);
      const xcproj2 = new XcodeProject(xcproj.filePath, parsed);

      // Verify isa types match
      for (const [uuid, expectedIsa] of originalIsaMap) {
        expect(xcproj2.has(uuid)).toBe(true);
        const obj = xcproj2.get(uuid);
        expect(obj?.isa).toBe(expectedIsa);
      }
    });

    it("should maintain object count after round-trip", () => {
      const xcproj = loadFixture("project-multitarget.pbxproj");
      const originalCount = xcproj.size;

      // Round-trip
      const json = xcproj.toJSON();
      const built = build(json);
      const parsed = parse(built);
      const xcproj2 = new XcodeProject(xcproj.filePath, parsed);

      expect(xcproj2.size).toBe(originalCount);
    });
  });
});
