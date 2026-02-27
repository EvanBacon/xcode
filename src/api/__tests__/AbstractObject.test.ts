import path from "path";
import {
  XcodeProject,
  PBXNativeTarget,
  PBXFileReference,
  PBXGroup,
} from "..";
import { loadFixture, captureWarnings } from "./test-utils";

const WORKING_FIXTURE = path.join(
  __dirname,
  "../../json/__tests__/fixtures/AFNetworking.pbxproj"
);

const MALFORMED_FIXTURE = path.join(__dirname, "fixtures/malformed.pbxproj");

const MULTITARGET_FIXTURE = path.join(
  __dirname,
  "../../json/__tests__/fixtures/project-multitarget.pbxproj"
);

describe("AbstractObject", () => {
  describe("inflate", () => {
    it("should inflate single object references (e.g., buildConfigurationList)", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const target = xcproj.getObject(
        "299522761BBF136400859F49"
      ) as PBXNativeTarget;

      // buildConfigurationList should be inflated to an object, not a UUID string
      expect(target.props.buildConfigurationList).toBeDefined();
      expect(typeof target.props.buildConfigurationList).toBe("object");
      expect(target.props.buildConfigurationList.uuid).toBeDefined();
      expect(target.props.buildConfigurationList.isa).toBe(
        "XCConfigurationList"
      );
    });

    it("should inflate array references (e.g., buildPhases)", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const target = xcproj.getObject(
        "299522761BBF136400859F49"
      ) as PBXNativeTarget;

      // buildPhases should be an array of inflated objects
      expect(Array.isArray(target.props.buildPhases)).toBe(true);
      expect(target.props.buildPhases.length).toBeGreaterThan(0);

      for (const phase of target.props.buildPhases) {
        expect(typeof phase).toBe("object");
        expect(phase.uuid).toBeDefined();
        expect(phase.isa).toBeDefined();
      }
    });

    it("should handle orphaned/missing UUIDs with console.warn", () => {
      const { warnings, restore } = captureWarnings();

      try {
        XcodeProject.open(MALFORMED_FIXTURE);

        expect(warnings.length).toBeGreaterThan(0);
        expect(warnings[0]).toContain("[Malformed Xcode project]");
        expect(warnings[0]).toContain("orphaned reference");
      } finally {
        restore();
      }
    });

    it("should skip nullish properties during inflation", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const target = xcproj.getObject(
        "299522761BBF136400859F49"
      ) as PBXNativeTarget;

      // productReference might be undefined for some targets
      // The key point is that undefined values don't cause errors
      expect(() => target.toJSON()).not.toThrow();
    });

    it("should not re-inflate already-inflated objects", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const target = xcproj.getObject(
        "299522761BBF136400859F49"
      ) as PBXNativeTarget;

      // Get the same object twice
      const configList1 = target.props.buildConfigurationList;
      const configList2 = xcproj.getObject(configList1.uuid);

      // Should be the exact same object instance
      expect(configList1).toBe(configList2);
    });
  });

  describe("toJSON", () => {
    it("should deflate single object references to UUIDs", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const target = xcproj.getObject(
        "299522761BBF136400859F49"
      ) as PBXNativeTarget;

      const json = target.toJSON();

      // buildConfigurationList should be a UUID string, not an object
      expect(typeof json.buildConfigurationList).toBe("string");
      expect(json.buildConfigurationList).toMatch(/^[A-F0-9]{24}$/);
    });

    it("should deflate array references to UUID arrays", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const target = xcproj.getObject(
        "299522761BBF136400859F49"
      ) as PBXNativeTarget;

      const json = target.toJSON();

      // buildPhases should be an array of UUID strings
      expect(Array.isArray(json.buildPhases)).toBe(true);
      for (const uuid of json.buildPhases) {
        expect(typeof uuid).toBe("string");
        expect(uuid).toMatch(/^[A-F0-9]{24}$/);
      }
    });

    it("should preserve isa field", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const target = xcproj.getObject(
        "299522761BBF136400859F49"
      ) as PBXNativeTarget;

      const json = target.toJSON();
      expect(json.isa).toBe("PBXNativeTarget");
    });

    it("should round-trip: inflate -> toJSON produces original structure", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);

      // Get original JSON structure from a known target UUID ("AFNetworking OS X")
      const targetUuid = "299522761BBF136400859F49";
      const target = xcproj.getObject(targetUuid) as PBXNativeTarget;

      // After inflating, toJSON should produce valid structure
      const json = target.toJSON();

      // Verify structure is serializable
      expect(() => JSON.stringify(json)).not.toThrow();

      // Key fields should be present
      expect(json.isa).toBe("PBXNativeTarget");
      expect(json.name).toBe("AFNetworking OS X");
      expect(typeof json.buildConfigurationList).toBe("string");
      expect(Array.isArray(json.buildPhases)).toBe(true);
      expect(Array.isArray(json.dependencies)).toBe(true);
    });
  });

  describe("isReferencing", () => {
    it("should detect UUID in single reference property", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const target = xcproj.getObject(
        "299522761BBF136400859F49"
      ) as PBXNativeTarget;

      const configListUuid = target.props.buildConfigurationList.uuid;
      expect(target.isReferencing(configListUuid)).toBe(true);
    });

    it("should detect UUID in array reference property", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const target = xcproj.getObject(
        "299522761BBF136400859F49"
      ) as PBXNativeTarget;

      const firstPhaseUuid = target.props.buildPhases[0].uuid;
      expect(target.isReferencing(firstPhaseUuid)).toBe(true);
    });

    it("should return false for unrelated UUID", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const target = xcproj.getObject(
        "299522761BBF136400859F49"
      ) as PBXNativeTarget;

      expect(target.isReferencing("NONEXISTENT1234567890AB")).toBe(false);
    });

    it("should return false for UUIDs in non-object props", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const target = xcproj.getObject(
        "299522761BBF136400859F49"
      ) as PBXNativeTarget;

      // The target's own UUID is not a "reference" to another object
      expect(target.isReferencing(target.uuid)).toBe(false);
    });
  });

  describe("removeReference", () => {
    it("should remove UUID from array references", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const target = xcproj.rootObject.getMainAppTarget();
      expect(target).toBeDefined();

      const initialPhaseCount = target!.props.buildPhases.length;
      expect(initialPhaseCount).toBeGreaterThan(0);

      const phaseToRemove = target!.props.buildPhases[0];
      const phaseUuid = phaseToRemove.uuid;

      target!.removeReference(phaseUuid);

      // Phase should be removed from array
      expect(target!.props.buildPhases.length).toBe(initialPhaseCount - 1);
      expect(
        target!.props.buildPhases.find((p) => p.uuid === phaseUuid)
      ).toBeUndefined();
    });

    it("should set single reference to undefined when matched", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const target = xcproj.rootObject.getMainAppTarget();
      expect(target).toBeDefined();
      expect(target!.props.productReference).toBeDefined();

      const productRefUuid = target!.props.productReference!.uuid;

      target!.removeReference(productRefUuid);

      // Product reference should be undefined
      expect(target!.props.productReference).toBeUndefined();
    });

    it("should not modify references that don't match", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const target = xcproj.rootObject.getMainAppTarget();
      expect(target).toBeDefined();

      const initialPhaseCount = target!.props.buildPhases.length;
      const configListUuid = target!.props.buildConfigurationList.uuid;

      // Try to remove a non-existent UUID
      target!.removeReference("NONEXISTENT1234567890AB");

      // Nothing should change
      expect(target!.props.buildPhases.length).toBe(initialPhaseCount);
      expect(target!.props.buildConfigurationList.uuid).toBe(configListUuid);
    });
  });

  describe("removeFromProject", () => {
    it("should remove object from project map", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);

      // Create a new file reference to remove
      const mainGroup = xcproj.rootObject.props.mainGroup;
      const newFile = mainGroup.createFile({ path: "test.swift" });
      const newFileUuid = newFile.uuid;

      expect(xcproj.has(newFileUuid)).toBe(true);

      newFile.removeFromProject();

      expect(xcproj.has(newFileUuid)).toBe(false);
    });

    it("should remove references from all referrers", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);

      // Create a file and add it to a group
      const mainGroup = xcproj.rootObject.props.mainGroup;
      const newFile = mainGroup.createFile({ path: "test2.swift" });

      // Verify it's in the group
      expect(
        mainGroup.props.children.find((c) => c.uuid === newFile.uuid)
      ).toBeDefined();

      newFile.removeFromProject();

      // Should be removed from group's children
      expect(
        mainGroup.props.children.find((c) => c.uuid === newFile.uuid)
      ).toBeUndefined();
    });
  });

  describe("getReferrers", () => {
    it("should find all objects referencing this object", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const target = xcproj.getObject(
        "299522761BBF136400859F49"
      ) as PBXNativeTarget;

      const referrers = target.getReferrers();

      // Should have at least the project referencing this target
      expect(referrers.length).toBeGreaterThan(0);

      // One referrer should be the PBXProject (targets array)
      const projectReferrer = referrers.find((r) => r.isa === "PBXProject");
      expect(projectReferrer).toBeDefined();
    });
  });

  describe("getDisplayName", () => {
    it("should return name prop if available", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const target = xcproj.getObject(
        "299522761BBF136400859F49"
      ) as PBXNativeTarget;

      expect(target.getDisplayName()).toBe("AFNetworking OS X");
    });

    it("should return isa-based name when no name prop", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);

      // Find a build phase (usually doesn't have a name)
      const target = xcproj.getObject(
        "299522761BBF136400859F49"
      ) as PBXNativeTarget;
      const sourcePhase = target.props.buildPhases.find(
        (p) => p.isa === "PBXSourcesBuildPhase"
      );

      expect(sourcePhase).toBeDefined();
      // PBXSourcesBuildPhase -> "SourcesBuildPhase"
      expect(sourcePhase!.getDisplayName()).toBe("SourcesBuildPhase");
    });
  });
});
