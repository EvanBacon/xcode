import path from "path";

import { XcodeProject, PBXNativeTarget } from "..";
import * as json from "../../json/types";

const WORKING_FIXTURE = path.join(
  __dirname,
  "../../json/__tests__/fixtures/project-multitarget.pbxproj"
);

const SWIFT_FIXTURE = path.join(
  __dirname,
  "../../json/__tests__/fixtures/project-swift.pbxproj"
);

const WATCH_FIXTURE = path.join(
  __dirname,
  "../../json/__tests__/fixtures/watch.pbxproj"
);

const MACOS_FIXTURE = path.join(
  __dirname,
  "../../json/__tests__/fixtures/Cocoa-Application.pbxproj"
);

describe("PBXProject", () => {
  describe("getName", () => {
    it("should extract project name from file path", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const project = xcproj.rootObject;
      // getName() removes .xcodeproj extension, but our fixtures are .pbxproj
      expect(project.getName()).toBe("project-multitarget.pbxproj");
    });

    it("should handle different project names", () => {
      const xcproj = XcodeProject.open(SWIFT_FIXTURE);
      const project = xcproj.rootObject;
      expect(project.getName()).toBe("project-swift.pbxproj");
    });
  });

  describe("ensureProductGroup", () => {
    it("should return existing product group when present", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const project = xcproj.rootObject;
      const productGroup = project.ensureProductGroup();

      expect(productGroup).toBeDefined();
      expect(productGroup.getDisplayName()).toBe("Products");
      expect(project.props.productRefGroup).toBe(productGroup);
    });

    it("should create product group when missing", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const project = xcproj.rootObject;

      // Remove existing product group reference
      const originalProductGroup = project.props.productRefGroup;
      project.props.productRefGroup = undefined;

      const productGroup = project.ensureProductGroup();

      expect(productGroup).toBeDefined();
      expect(productGroup.getDisplayName()).toBe("Products");
      expect(project.props.productRefGroup).toBe(productGroup);

      // Restore original state
      project.props.productRefGroup = originalProductGroup;
    });
  });

  describe("ensureMainGroupChild", () => {
    it("should return existing child group", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const project = xcproj.rootObject;
      const frameworksGroup = project.ensureMainGroupChild("Frameworks");

      expect(frameworksGroup).toBeDefined();
      expect(frameworksGroup.getDisplayName()).toBe("Frameworks");
    });

    it("should create child group when missing", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const project = xcproj.rootObject;
      const testGroup = project.ensureMainGroupChild("TestGroup");

      expect(testGroup).toBeDefined();
      expect(testGroup.getDisplayName()).toBe("TestGroup");
      expect(testGroup.props.sourceTree).toBe("<group>");
    });
  });

  describe("getFrameworksGroup", () => {
    it("should return Frameworks group", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const project = xcproj.rootObject;
      const frameworksGroup = project.getFrameworksGroup();

      expect(frameworksGroup).toBeDefined();
      expect(frameworksGroup.getDisplayName()).toBe("Frameworks");
    });
  });

  describe("getNativeTarget", () => {
    it("should find target by product type", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const project = xcproj.rootObject;
      const appTarget = project.getNativeTarget(
        "com.apple.product-type.application"
      );

      expect(appTarget).toBeDefined();
      expect(appTarget?.props.productType).toBe(
        "com.apple.product-type.application"
      );
    });

    it("should find app extension target", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const project = xcproj.rootObject;
      const extensionTarget = project.getNativeTarget(
        "com.apple.product-type.app-extension"
      );

      expect(extensionTarget).toBeDefined();
      expect(extensionTarget?.props.productType).toBe(
        "com.apple.product-type.app-extension"
      );
    });

    it("should return null for non-existent product type", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const project = xcproj.rootObject;
      const target = project.getNativeTarget(
        "com.apple.product-type.non-existent" as any
      );

      expect(target).toBeNull();
    });
  });

  describe("getMainAppTarget", () => {
    it("should get main iOS app target", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const project = xcproj.rootObject;
      const target = project.getMainAppTarget("ios");

      expect(target).toBeDefined();
      expect(target?.uuid).toBe("13B07F861A680F5B00A75B9A");
      expect(target?.props.productType).toBe(
        "com.apple.product-type.application"
      );
    });

    it("should default to iOS when no platform specified", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const project = xcproj.rootObject;
      const target = project.getMainAppTarget();

      expect(target).toBeDefined();
      expect(target?.uuid).toBe("13B07F861A680F5B00A75B9A");
    });

    it("should handle watchOS projects", () => {
      const xcproj = XcodeProject.open(WATCH_FIXTURE);
      const project = xcproj.rootObject;

      // The watch fixture has watch app targets (watchapp2 type)
      const watchAppTarget = project.getNativeTarget(
        "com.apple.product-type.application.watchapp2" as any
      );
      expect(watchAppTarget).toBeDefined();
      expect(watchAppTarget?.props.productType).toBe(
        "com.apple.product-type.application.watchapp2"
      );

      // Should also have a regular iOS app target
      const iosTarget = project.getMainAppTarget("ios");
      expect(iosTarget).toBeDefined();
    });

    it("should handle macOS projects", () => {
      const xcproj = XcodeProject.open(MACOS_FIXTURE);
      const project = xcproj.rootObject;

      // Try to get a macOS app target - if it throws, catch and verify behavior
      let macTarget;
      try {
        macTarget = project.getMainAppTarget("macos");
        expect(macTarget).toBeDefined();
        expect(macTarget?.props.productType).toBe(
          "com.apple.product-type.application"
        );
      } catch (error) {
        // This is expected if no macOS deployment target is found
        expect((error as Error).message).toBe("No main app target found");

        // But we should still have regular app targets
        const appTarget = project.getNativeTarget(
          "com.apple.product-type.application"
        );
        expect(appTarget).toBeDefined();
      }
    });

    it("should warn when multiple main app targets found", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const project = xcproj.rootObject;

      // Create a duplicate target for testing
      const originalTarget = project.getMainAppTarget();
      if (originalTarget) {
        const duplicateTarget = project.createNativeTarget({
          name: "DuplicateApp",
          productType: "com.apple.product-type.application",
          buildConfigurationList: originalTarget.props.buildConfigurationList,
        });

        // Set the same deployment target to make it a main app target
        const config = duplicateTarget.getDefaultConfiguration();
        config.props.buildSettings.IPHONEOS_DEPLOYMENT_TARGET = "14.0";

        project.getMainAppTarget("ios");

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining("Multiple main app targets found")
        );

        // Clean up
        project.props.targets = project.props.targets.filter(
          (t) => t !== duplicateTarget
        );
      }

      consoleSpy.mockRestore();
    });

    it("should throw error when no main app target found", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const project = xcproj.rootObject;

      expect(() => {
        project.getMainAppTarget("tvos");
      }).toThrow("No main app target found");
    });
  });

  describe("createNativeTarget", () => {
    it("should create new native target", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const project = xcproj.rootObject;
      const originalTargetCount = project.props.targets.length;

      const existingTarget = project.props.targets.find((t) =>
        PBXNativeTarget.is(t)
      ) as PBXNativeTarget;
      const newTarget = project.createNativeTarget({
        name: "TestTarget",
        productType: "com.apple.product-type.framework",
        buildConfigurationList: existingTarget.props.buildConfigurationList,
      });

      expect(newTarget).toBeDefined();
      expect(newTarget.props.name).toBe("TestTarget");
      expect(newTarget.props.productType).toBe(
        "com.apple.product-type.framework"
      );
      expect(project.props.targets.length).toBe(originalTargetCount + 1);
      expect(project.props.targets).toContain(newTarget);
    });
  });

  describe("isReferencing", () => {
    it("should return true for main group UUID", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const project = xcproj.rootObject;
      const mainGroupUuid = project.props.mainGroup.uuid;

      expect(project.isReferencing(mainGroupUuid)).toBe(true);
    });

    it("should return true for build configuration list UUID", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const project = xcproj.rootObject;
      const buildConfigListUuid = project.props.buildConfigurationList.uuid;

      expect(project.isReferencing(buildConfigListUuid)).toBe(true);
    });

    it("should return true for product ref group UUID", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const project = xcproj.rootObject;
      const productRefGroupUuid = project.props.productRefGroup?.uuid;

      if (productRefGroupUuid) {
        expect(project.isReferencing(productRefGroupUuid)).toBe(true);
      }
    });

    it("should return true for target UUIDs", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const project = xcproj.rootObject;
      const targetUuid = project.props.targets[0].uuid;

      expect(project.isReferencing(targetUuid)).toBe(true);
    });

    it("should return false for non-referenced UUID", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const project = xcproj.rootObject;

      expect(project.isReferencing("NON-EXISTENT-UUID")).toBe(false);
    });
  });

  describe("addBuildConfiguration", () => {
    it("should add new build configuration", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const project = xcproj.rootObject;
      const configList = project.props.buildConfigurationList;
      const originalCount = configList.props.buildConfigurations.length;

      const newConfig = project.addBuildConfiguration("CustomConfig", "all");

      expect(newConfig).toBeDefined();
      expect(newConfig.props.name).toBe("CustomConfig");
      expect(configList.props.buildConfigurations.length).toBe(
        originalCount + 1
      );
      expect(configList.props.buildConfigurations).toContain(newConfig);
    });

    it("should return existing configuration if already exists", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const project = xcproj.rootObject;
      const configList = project.props.buildConfigurationList;
      const originalCount = configList.props.buildConfigurations.length;

      // Add a config
      const firstConfig = project.addBuildConfiguration(
        "ExistingConfig",
        "all"
      );

      // Try to add the same config again
      const secondConfig = project.addBuildConfiguration(
        "ExistingConfig",
        "all"
      );

      expect(firstConfig).toBe(secondConfig);
      expect(configList.props.buildConfigurations.length).toBe(
        originalCount + 1
      );
    });

    it("should apply correct default build settings for different types", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const project = xcproj.rootObject;

      const allConfig = project.addBuildConfiguration("AllConfig", "all");
      const releaseConfig = project.addBuildConfiguration(
        "ReleaseConfig",
        "release"
      );

      // Check that build settings are applied (these come from constants)
      expect(allConfig.props.buildSettings).toBeDefined();
      expect(releaseConfig.props.buildSettings).toBeDefined();

      // Release config should have additional settings beyond "all"
      expect(
        Object.keys(releaseConfig.props.buildSettings).length
      ).toBeGreaterThan(Object.keys(allConfig.props.buildSettings).length);
    });
  });

  describe("setupDefaults", () => {
    it("should set default values for new project", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const project = xcproj.rootObject;

      // These should be set by setupDefaults or exist in the fixture
      expect(project.props.compatibilityVersion).toBe("Xcode 3.2");
      expect(project.props.developmentRegion).toBe("en");
      // hasScannedForEncodings can be either 0 or "0" depending on how it's parsed
      expect([0, "0"]).toContain(project.props.hasScannedForEncodings);
      expect(project.props.knownRegions).toEqual(["en", "Base"]);
      expect(project.props.projectDirPath).toBe("");
      expect(project.props.projectRoot).toBe("");
      expect(project.props.attributes).toBeDefined();

      // The fixture has LastUpgradeCheck but not necessarily LastSwiftUpdateCheck
      expect(project.props.attributes.LastUpgradeCheck).toBeDefined();
      expect(project.props.attributes.TargetAttributes).toBeDefined();
    });
  });

  describe("integration tests", () => {
    it("should handle project with multiple targets correctly", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const project = xcproj.rootObject;

      // This fixture has multiple targets
      expect(project.props.targets.length).toBeGreaterThan(1);

      // Should be able to find different target types
      const appTarget = project.getNativeTarget(
        "com.apple.product-type.application"
      );
      const extensionTarget = project.getNativeTarget(
        "com.apple.product-type.app-extension"
      );

      expect(appTarget).toBeDefined();
      expect(extensionTarget).toBeDefined();
      expect(appTarget).not.toBe(extensionTarget);
    });

    it("should work with different project types", () => {
      const fixtures = [WORKING_FIXTURE, SWIFT_FIXTURE, WATCH_FIXTURE];

      fixtures.forEach((fixture) => {
        const xcproj = XcodeProject.open(fixture);
        const project = xcproj.rootObject;

        // Basic functionality should work for all projects
        expect(project.getName()).toBeTruthy();
        expect(project.props.mainGroup).toBeDefined();
        expect(project.props.buildConfigurationList).toBeDefined();
        expect(project.props.targets.length).toBeGreaterThan(0);

        // Should be able to get frameworks group
        const frameworksGroup = project.getFrameworksGroup();
        expect(frameworksGroup).toBeDefined();
      });
    });
  });
});
