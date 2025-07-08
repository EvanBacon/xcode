import path from "path";

import {
  PBXNativeTarget,
  XcodeProject,
  PBXFrameworksBuildPhase,
  PBXCopyFilesBuildPhase,
  PBXFileReference,
} from "..";

const WORKING_FIXTURE = path.join(
  __dirname,
  "../../json/__tests__/fixtures/AFNetworking.pbxproj"
);

const MULTITARGET_FIXTURE = path.join(
  __dirname,
  "../../json/__tests__/fixtures/project-multitarget.pbxproj"
);

const WATCH_FIXTURE = path.join(
  __dirname,
  "../../json/__tests__/fixtures/watch.pbxproj"
);

describe("PBXNativeTarget", () => {
  describe("basic functionality", () => {
    it("gets referrers", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const obj = xcproj.getObject(
        "299522761BBF136400859F49"
      ) as PBXNativeTarget;

      expect(obj.getReferrers().map((o) => o.uuid)).toEqual([
        "299522301BBF104D00859F49",
      ]);
    });

    it("sets build setting", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const obj = xcproj.getObject(
        "299522761BBF136400859F49"
      ) as PBXNativeTarget;

      // Sanity
      expect(obj.getDefaultBuildSetting("IPHONEOS_DEPLOYMENT_TARGET")).toBe(
        "8.0"
      );

      expect(obj.setBuildSetting("IPHONEOS_DEPLOYMENT_TARGET", "17.0")).toBe(
        "17.0"
      );

      expect(obj.getDefaultBuildSetting("IPHONEOS_DEPLOYMENT_TARGET")).toBe(
        "17.0"
      );

      obj.removeBuildSetting("IPHONEOS_DEPLOYMENT_TARGET");

      expect(obj.getDefaultBuildSetting("IPHONEOS_DEPLOYMENT_TARGET")).toBe(
        undefined
      );
    });
  });

  describe("create", () => {
    it("should create new native target with minimal options", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const project = xcproj.rootObject;
      const existingTarget = project.props.targets.find((t) =>
        PBXNativeTarget.is(t)
      ) as PBXNativeTarget;

      const newTarget = PBXNativeTarget.create(xcproj, {
        name: "TestTarget",
        productType: "com.apple.product-type.framework",
        buildConfigurationList: existingTarget.props.buildConfigurationList,
      });

      expect(newTarget).toBeDefined();
      expect(newTarget.props.name).toBe("TestTarget");
      expect(newTarget.props.productType).toBe(
        "com.apple.product-type.framework"
      );
      expect(newTarget.props.buildPhases).toEqual([]);
      expect(newTarget.props.buildRules).toEqual([]);
      expect(newTarget.props.dependencies).toEqual([]);
    });
  });

  describe("isReferencing", () => {
    it("should return true for build rule UUIDs", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const target = xcproj.getObject(
        "299522761BBF136400859F49"
      ) as PBXNativeTarget;

      if (target.props.buildRules.length > 0) {
        const buildRuleUuid = target.props.buildRules[0].uuid;
        expect(target.isReferencing(buildRuleUuid)).toBe(true);
      }
    });

    it("should return true for product reference UUID", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const target = xcproj.getObject(
        "299522761BBF136400859F49"
      ) as PBXNativeTarget;

      if (target.props.productReference) {
        expect(target.isReferencing(target.props.productReference.uuid)).toBe(
          true
        );
      }
    });

    it("should return false for non-referenced UUID", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const target = xcproj.getObject(
        "299522761BBF136400859F49"
      ) as PBXNativeTarget;

      expect(target.isReferencing("NON-EXISTENT-UUID")).toBe(false);
    });
  });

  describe("build phase management", () => {
    it("should get or create frameworks build phase", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const target = xcproj.getObject(
        "299522761BBF136400859F49"
      ) as PBXNativeTarget;

      const frameworksPhase = target.getFrameworksBuildPhase();
      expect(frameworksPhase).toBeDefined();
      expect(PBXFrameworksBuildPhase.is(frameworksPhase)).toBe(true);

      // Should return the same instance on second call
      const frameworksPhase2 = target.getFrameworksBuildPhase();
      expect(frameworksPhase2).toBe(frameworksPhase);
    });

    it("should get or create sources build phase", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const target = xcproj.getObject(
        "299522761BBF136400859F49"
      ) as PBXNativeTarget;

      const sourcesPhase = target.getSourcesBuildPhase();
      expect(sourcesPhase).toBeDefined();

      // Should return the same instance on second call
      const sourcesPhase2 = target.getSourcesBuildPhase();
      expect(sourcesPhase2).toBe(sourcesPhase);
    });

    it("should get or create resources build phase", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const target = xcproj.getObject(
        "299522761BBF136400859F49"
      ) as PBXNativeTarget;

      const resourcesPhase = target.getResourcesBuildPhase();
      expect(resourcesPhase).toBeDefined();

      // Should return the same instance on second call
      const resourcesPhase2 = target.getResourcesBuildPhase();
      expect(resourcesPhase2).toBe(resourcesPhase);
    });

    it("should get or create headers build phase", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const target = xcproj.getObject(
        "299522761BBF136400859F49"
      ) as PBXNativeTarget;

      const headersPhase = target.getHeadersBuildPhase();
      expect(headersPhase).toBeDefined();

      // Should return the same instance on second call
      const headersPhase2 = target.getHeadersBuildPhase();
      expect(headersPhase2).toBe(headersPhase);
    });
  });

  describe("ensureFrameworks", () => {
    it("should add new frameworks to target", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const target = xcproj.rootObject.getMainAppTarget();
      expect(target).toBeDefined();

      const frameworks = ["SwiftUI.framework", "WidgetKit.framework"];
      const buildFiles = target!.ensureFrameworks(frameworks);

      expect(buildFiles).toHaveLength(2);
      expect(buildFiles[0]).toBeDefined();
      expect(buildFiles[1]).toBeDefined();

      // Check that frameworks were added to build phase
      const frameworksPhase = target!.getFrameworksBuildPhase();
      expect(frameworksPhase.props.files).toContain(buildFiles[0]);
      expect(frameworksPhase.props.files).toContain(buildFiles[1]);
    });

    it("should handle frameworks without .framework extension", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const target = xcproj.rootObject.getMainAppTarget();
      expect(target).toBeDefined();

      const frameworks = ["UIKit", "Foundation"];
      const buildFiles = target!.ensureFrameworks(frameworks);

      expect(buildFiles).toHaveLength(2);

      // Check that the file references have the correct names
      const frameworksFolder = xcproj.rootObject.getFrameworksGroup();
      const uikitRef = frameworksFolder.props.children.find(
        (child) =>
          PBXFileReference.is(child) && child.props.name === "UIKit.framework"
      );
      const foundationRef = frameworksFolder.props.children.find(
        (child) =>
          PBXFileReference.is(child) &&
          child.props.name === "Foundation.framework"
      );

      expect(uikitRef).toBeDefined();
      expect(foundationRef).toBeDefined();
    });

    it("should reuse existing framework file references", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const target = xcproj.rootObject.getMainAppTarget();
      expect(target).toBeDefined();

      // Add framework first time
      const buildFiles1 = target!.ensureFrameworks(["CoreData.framework"]);

      // Add same framework again
      const buildFiles2 = target!.ensureFrameworks(["CoreData.framework"]);

      // Should reuse the same file reference
      expect(buildFiles1[0].props.fileRef).toBe(buildFiles2[0].props.fileRef);
    });

    it("should add frameworks to Frameworks group", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const target = xcproj.rootObject.getMainAppTarget();
      expect(target).toBeDefined();

      const frameworksFolder = xcproj.rootObject.getFrameworksGroup();
      const initialChildCount = frameworksFolder.props.children.length;

      target!.ensureFrameworks(["CloudKit.framework"]);

      // Should have added one more child to Frameworks group
      expect(frameworksFolder.props.children.length).toBeGreaterThan(
        initialChildCount
      );

      const cloudKitRef = frameworksFolder.props.children.find(
        (child) =>
          PBXFileReference.is(child) &&
          child.props.name === "CloudKit.framework"
      );
      expect(cloudKitRef).toBeDefined();
    });
  });

  describe("addDependency", () => {
    it("should add dependency between targets in same project", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const project = xcproj.rootObject;
      const mainTarget = project.getMainAppTarget();

      // Create a new target to add as dependency (to avoid existing dependencies)
      const newTarget = project.createNativeTarget({
        name: "TestDependencyTarget",
        productType: "com.apple.product-type.framework",
        buildConfigurationList: mainTarget!.props.buildConfigurationList,
      });

      const initialDependencyCount = mainTarget!.props.dependencies.length;

      mainTarget!.addDependency(newTarget);

      // Should have added one dependency
      expect(mainTarget!.props.dependencies.length).toBe(
        initialDependencyCount + 1
      );

      // Check that the dependency points to the correct target
      const newDependency =
        mainTarget!.props.dependencies[
          mainTarget!.props.dependencies.length - 1
        ];
      expect(newDependency.props.target).toBe(newTarget);
    });

    it("should not add duplicate dependencies", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const mainTarget = xcproj.rootObject.getMainAppTarget();
      const extensionTarget = xcproj.rootObject.getNativeTarget(
        "com.apple.product-type.app-extension"
      );

      expect(mainTarget).toBeDefined();
      expect(extensionTarget).toBeDefined();

      // Add dependency twice
      mainTarget!.addDependency(extensionTarget!);
      const dependencyCountAfterFirst = mainTarget!.props.dependencies.length;

      mainTarget!.addDependency(extensionTarget!);
      const dependencyCountAfterSecond = mainTarget!.props.dependencies.length;

      // Should not have added a second dependency
      expect(dependencyCountAfterSecond).toBe(dependencyCountAfterFirst);
    });

    it("should create container item proxy for dependency", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const project = xcproj.rootObject;

      // Create a new target to add as dependency
      const mainTarget = project.getMainAppTarget();
      const newTarget = project.createNativeTarget({
        name: "TestDependency",
        productType: "com.apple.product-type.framework",
        buildConfigurationList: mainTarget!.props.buildConfigurationList,
      });

      mainTarget!.addDependency(newTarget);

      // Check that dependency was created with proper container proxy
      const dependency =
        mainTarget!.props.dependencies[
          mainTarget!.props.dependencies.length - 1
        ];
      expect(dependency.props.targetProxy).toBeDefined();
      expect(dependency.props.targetProxy.props.remoteGlobalIDString).toBe(
        newTarget.uuid
      );
      expect(dependency.props.targetProxy.props.remoteInfo).toBe(
        "TestDependency"
      );
      expect(dependency.props.targetProxy.props.containerPortal).toBe(project);
    });
  });

  describe("getCopyBuildPhaseForTarget", () => {
    it("should create copy build phase for app extension", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const mainTarget = xcproj.rootObject.getMainAppTarget();
      const extensionTarget = xcproj.rootObject.getNativeTarget(
        "com.apple.product-type.app-extension"
      );

      expect(mainTarget).toBeDefined();
      expect(extensionTarget).toBeDefined();

      const copyPhase = mainTarget!.getCopyBuildPhaseForTarget(
        extensionTarget!
      );

      expect(copyPhase).toBeDefined();
      expect(PBXCopyFilesBuildPhase.is(copyPhase)).toBe(true);
      expect(copyPhase.props.name).toBe("Embed Foundation Extensions");
    });

    it("should create copy build phase for app clips", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const mainTarget = xcproj.rootObject.getMainAppTarget();

      // Create an app clip target
      const appClipTarget = xcproj.rootObject.createNativeTarget({
        name: "TestAppClip",
        productType:
          "com.apple.product-type.application.on-demand-install-capable",
        buildConfigurationList: mainTarget!.props.buildConfigurationList,
      });

      const copyPhase = mainTarget!.getCopyBuildPhaseForTarget(appClipTarget);

      expect(copyPhase).toBeDefined();
      expect(copyPhase.props.name).toBe("Embed App Clips");
    });

    it("should create copy build phase for watch app", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const mainTarget = xcproj.rootObject.getMainAppTarget();

      // Create a watch app target
      const watchTarget = xcproj.rootObject.createNativeTarget({
        name: "TestWatchApp",
        productType: "com.apple.product-type.application",
        buildConfigurationList: mainTarget!.props.buildConfigurationList,
      });

      const copyPhase = mainTarget!.getCopyBuildPhaseForTarget(watchTarget);

      expect(copyPhase).toBeDefined();
      expect(copyPhase.props.name).toBe("Embed Watch Content");
    });

    it("should create copy build phase for ExtensionKit extensions", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const mainTarget = xcproj.rootObject.getMainAppTarget();

      // Create an ExtensionKit extension target
      const extensionKitTarget = xcproj.rootObject.createNativeTarget({
        name: "TestExtensionKit",
        productType: "com.apple.product-type.extensionkit-extension",
        buildConfigurationList: mainTarget!.props.buildConfigurationList,
      });

      const copyPhase =
        mainTarget!.getCopyBuildPhaseForTarget(extensionKitTarget);

      expect(copyPhase).toBeDefined();
      expect(copyPhase.props.name).toBe("Embed ExtensionKit Extensions");
    });

    it("should reuse existing copy build phase", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const mainTarget = xcproj.rootObject.getMainAppTarget();
      const extensionTarget = xcproj.rootObject.getNativeTarget(
        "com.apple.product-type.app-extension"
      );

      expect(mainTarget).toBeDefined();
      expect(extensionTarget).toBeDefined();

      const copyPhase1 = mainTarget!.getCopyBuildPhaseForTarget(
        extensionTarget!
      );
      const copyPhase2 = mainTarget!.getCopyBuildPhaseForTarget(
        extensionTarget!
      );

      // Should return the same instance
      expect(copyPhase1).toBe(copyPhase2);
    });

    it("should throw error when called on non-main target", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const extensionTarget = xcproj.rootObject.getNativeTarget(
        "com.apple.product-type.app-extension"
      );
      const mainTarget = xcproj.rootObject.getMainAppTarget();

      expect(extensionTarget).toBeDefined();
      expect(mainTarget).toBeDefined();

      expect(() => {
        extensionTarget!.getCopyBuildPhaseForTarget(mainTarget!);
      }).toThrow(
        "getCopyBuildPhaseForTarget can only be called on the main target"
      );
    });
  });

  describe("isWatchOSTarget", () => {
    it("should return true for watchOS app targets", () => {
      const xcproj = XcodeProject.open(WATCH_FIXTURE);

      // Find a target with WATCHOS_DEPLOYMENT_TARGET
      let watchTarget: PBXNativeTarget | null = null;
      for (const target of xcproj.rootObject.props.targets) {
        if (
          PBXNativeTarget.is(target) &&
          target.props.productType === "com.apple.product-type.application" &&
          target.getDefaultBuildSetting("WATCHOS_DEPLOYMENT_TARGET")
        ) {
          watchTarget = target;
          break;
        }
      }

      if (watchTarget) {
        expect(watchTarget.isWatchOSTarget()).toBe(true);
      } else {
        // If no watchOS target found, create one for testing
        const xcproj2 = XcodeProject.open(MULTITARGET_FIXTURE);
        const mainTarget = xcproj2.rootObject.getMainAppTarget();
        const testWatchTarget = xcproj2.rootObject.createNativeTarget({
          name: "TestWatchApp",
          productType: "com.apple.product-type.application",
          buildConfigurationList: mainTarget!.props.buildConfigurationList,
        });

        // Set WATCHOS_DEPLOYMENT_TARGET to make it a watchOS target
        testWatchTarget.setBuildSetting("WATCHOS_DEPLOYMENT_TARGET", "8.0");

        expect(testWatchTarget.isWatchOSTarget()).toBe(true);
      }
    });

    it("should return false for iOS app targets", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const mainTarget = xcproj.rootObject.getMainAppTarget();

      expect(mainTarget).toBeDefined();
      expect(mainTarget!.isWatchOSTarget()).toBe(false);
    });

    it("should return false for non-application targets", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const extensionTarget = xcproj.rootObject.getNativeTarget(
        "com.apple.product-type.app-extension"
      );

      expect(extensionTarget).toBeDefined();
      expect(extensionTarget!.isWatchOSTarget()).toBe(false);
    });

    it("should return false for application targets without WATCHOS_DEPLOYMENT_TARGET", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const mainTarget = xcproj.rootObject.getMainAppTarget();
      const testTarget = xcproj.rootObject.createNativeTarget({
        name: "TestApp",
        productType: "com.apple.product-type.application",
        buildConfigurationList: mainTarget!.props.buildConfigurationList,
      });

      // Ensure no WATCHOS_DEPLOYMENT_TARGET is set
      testTarget.removeBuildSetting("WATCHOS_DEPLOYMENT_TARGET");

      expect(testTarget.isWatchOSTarget()).toBe(false);
    });
  });

  describe("integration tests", () => {
    it("should handle complex target relationships", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const mainTarget = xcproj.rootObject.getMainAppTarget();
      const extensionTarget = xcproj.rootObject.getNativeTarget(
        "com.apple.product-type.app-extension"
      );

      expect(mainTarget).toBeDefined();
      expect(extensionTarget).toBeDefined();

      // Add frameworks to both targets
      mainTarget!.ensureFrameworks(["SwiftUI.framework"]);
      extensionTarget!.ensureFrameworks(["WidgetKit.framework"]);

      // Add dependency
      mainTarget!.addDependency(extensionTarget!);

      // Create copy build phase
      const copyPhase = mainTarget!.getCopyBuildPhaseForTarget(
        extensionTarget!
      );

      // Verify everything is connected properly
      expect(
        mainTarget!.getFrameworksBuildPhase().props.files.length
      ).toBeGreaterThan(0);
      expect(
        extensionTarget!.getFrameworksBuildPhase().props.files.length
      ).toBeGreaterThan(0);
      expect(mainTarget!.props.dependencies.length).toBeGreaterThan(0);
      expect(copyPhase).toBeDefined();
    });

    it("should work across different project fixtures", () => {
      const fixtures = [WORKING_FIXTURE, MULTITARGET_FIXTURE, WATCH_FIXTURE];

      fixtures.forEach((fixture) => {
        const xcproj = XcodeProject.open(fixture);

        // Find any native target
        const nativeTarget = xcproj.rootObject.props.targets.find((t) =>
          PBXNativeTarget.is(t)
        ) as PBXNativeTarget;

        if (nativeTarget) {
          // Basic functionality should work
          expect(nativeTarget.getFrameworksBuildPhase()).toBeDefined();
          expect(nativeTarget.getSourcesBuildPhase()).toBeDefined();
          expect(nativeTarget.getResourcesBuildPhase()).toBeDefined();
          expect(typeof nativeTarget.isWatchOSTarget()).toBe("boolean");
        }
      });
    });
  });
});
