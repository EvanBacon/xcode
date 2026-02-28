import path from "path";

import {
  PBXNativeTarget,
  XcodeProject,
  PBXFrameworksBuildPhase,
  PBXCopyFilesBuildPhase,
  PBXFileReference,
} from "..";
import * as json from "../../json/types";

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

const APP_CLIP_FIXTURE = path.join(
  __dirname,
  "../../json/__tests__/fixtures/009-expo-app-clip.pbxproj"
);

describe("PBXNativeTarget", () => {
  describe("basic functionality", () => {
    it("gets referrers", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const obj = xcproj.getObject(
        "299522761BBF136400859F49"
      ) as PBXNativeTarget;

      expect(
        obj
          .getReferrers()
          .map((o) => o.uuid)
          .sort()
      ).toEqual([
        "298D7C511BC2C7B200FD3B3E", // PBXTargetDependency that references this target
        "299522301BBF104D00859F49", // PBXProject that contains this target
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

      // Create a watch app target with correct watchOS product type
      const watchTarget = xcproj.rootObject.createNativeTarget({
        name: "TestWatchApp",
        productType: "com.apple.product-type.application.watchapp2",
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
    it("should return true for watchapp2 targets", () => {
      const xcproj = XcodeProject.open(WATCH_FIXTURE);

      // Find a target with watchapp2 product type
      const watchTarget = xcproj.rootObject.props.targets.find(
        (target) =>
          PBXNativeTarget.is(target) &&
          target.props.productType ===
            "com.apple.product-type.application.watchapp2"
      ) as PBXNativeTarget | undefined;

      expect(watchTarget).toBeDefined();
      expect(watchTarget!.isWatchOSTarget()).toBe(true);
    });

    it("should return true for watchapp targets", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const mainTarget = xcproj.rootObject.getMainAppTarget();
      const testWatchTarget = xcproj.rootObject.createNativeTarget({
        name: "TestWatchApp",
        productType: "com.apple.product-type.application.watchapp",
        buildConfigurationList: mainTarget!.props.buildConfigurationList,
      });

      expect(testWatchTarget.isWatchOSTarget()).toBe(true);
    });

    it("should return true for watchapp2-container targets", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const mainTarget = xcproj.rootObject.getMainAppTarget();
      const testWatchTarget = xcproj.rootObject.createNativeTarget({
        name: "TestWatchAppContainer",
        productType: "com.apple.product-type.application.watchapp2-container",
        buildConfigurationList: mainTarget!.props.buildConfigurationList,
      });

      expect(testWatchTarget.isWatchOSTarget()).toBe(true);
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

    it("should return false for regular application targets even with WATCHOS_DEPLOYMENT_TARGET", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const mainTarget = xcproj.rootObject.getMainAppTarget();
      const testTarget = xcproj.rootObject.createNativeTarget({
        name: "TestApp",
        productType: "com.apple.product-type.application",
        buildConfigurationList: mainTarget!.props.buildConfigurationList,
      });

      // Even with WATCHOS_DEPLOYMENT_TARGET, a regular application is not a watchOS target
      testTarget.setBuildSetting("WATCHOS_DEPLOYMENT_TARGET", "8.0");

      expect(testTarget.isWatchOSTarget()).toBe(false);
    });
  });

  describe("isWatchExtension", () => {
    it("should return true for watchkit-extension targets", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const mainTarget = xcproj.rootObject.getMainAppTarget();
      const watchExtTarget = xcproj.rootObject.createNativeTarget({
        name: "TestWatchExtension",
        productType: "com.apple.product-type.watchkit-extension",
        buildConfigurationList: mainTarget!.props.buildConfigurationList,
      });

      expect(watchExtTarget.isWatchExtension()).toBe(true);
    });

    it("should return true for watchkit2-extension targets", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const mainTarget = xcproj.rootObject.getMainAppTarget();
      const watchExtTarget = xcproj.rootObject.createNativeTarget({
        name: "TestWatch2Extension",
        productType: "com.apple.product-type.watchkit2-extension",
        buildConfigurationList: mainTarget!.props.buildConfigurationList,
      });

      expect(watchExtTarget.isWatchExtension()).toBe(true);
    });

    it("should return false for watchOS app targets", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const mainTarget = xcproj.rootObject.getMainAppTarget();
      const watchTarget = xcproj.rootObject.createNativeTarget({
        name: "TestWatchApp",
        productType: "com.apple.product-type.application.watchapp2",
        buildConfigurationList: mainTarget!.props.buildConfigurationList,
      });

      expect(watchTarget.isWatchExtension()).toBe(false);
    });

    it("should return false for regular app extensions", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const extensionTarget = xcproj.rootObject.getNativeTarget(
        "com.apple.product-type.app-extension"
      );

      expect(extensionTarget).toBeDefined();
      expect(extensionTarget!.isWatchExtension()).toBe(false);
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

  describe("removeFromProject", () => {
    it("should remove app clip target and its exclusive children from project", () => {
      const xcproj = XcodeProject.open(APP_CLIP_FIXTURE);
      const project = xcproj.rootObject;

      // Get the app clip target
      const appClipTarget = xcproj.getObject(
        "XX42A75F8F031FED491C16XX"
      ) as PBXNativeTarget;
      expect(appClipTarget).toBeDefined();
      expect(appClipTarget.props.productType).toBe(
        "com.apple.product-type.application.on-demand-install-capable"
      );

      // Record UUIDs of objects that should be removed
      const appClipBuildConfigList = appClipTarget.props.buildConfigurationList;
      const appClipBuildConfigs = [
        ...appClipBuildConfigList.props.buildConfigurations,
      ];
      const appClipProductRef = appClipTarget.props.productReference;
      const appClipFileSystemGroups =
        appClipTarget.props.fileSystemSynchronizedGroups || [];

      // Get the main target to verify it's not affected
      const mainTarget = project.props.targets.find(
        (t) => PBXNativeTarget.is(t) && t.uuid !== appClipTarget.uuid
      ) as PBXNativeTarget;
      expect(mainTarget).toBeDefined();
      const mainTargetUuid = mainTarget.uuid;

      // Count initial objects
      const initialTargetCount = project.props.targets.length;
      const initialObjectCount = xcproj.size;

      // Remove the app clip target
      appClipTarget.removeFromProject();

      // Verify target was removed from project
      expect(project.props.targets.length).toBe(initialTargetCount - 1);
      expect(
        project.props.targets.find((t) => t.uuid === "XX42A75F8F031FED491C16XX")
      ).toBeUndefined();

      // Verify target is no longer in the project map
      expect(xcproj.has("XX42A75F8F031FED491C16XX")).toBe(false);

      // Verify build configuration list was removed
      expect(xcproj.has(appClipBuildConfigList.uuid)).toBe(false);

      // Verify build configurations were removed
      for (const config of appClipBuildConfigs) {
        expect(xcproj.has(config.uuid)).toBe(false);
      }

      // Verify product reference was removed
      if (appClipProductRef) {
        expect(xcproj.has(appClipProductRef.uuid)).toBe(false);
      }

      // Verify file system synchronized groups were removed
      for (const group of appClipFileSystemGroups) {
        expect(xcproj.has(group.uuid)).toBe(false);
      }

      // Verify objects were actually removed (not just from arrays)
      expect(xcproj.size).toBeLessThan(initialObjectCount);

      // Verify main target still exists and is functional
      expect(xcproj.has(mainTargetUuid)).toBe(true);
      const stillExistingMainTarget = xcproj.getObject(
        mainTargetUuid
      ) as PBXNativeTarget;
      expect(stillExistingMainTarget.props.name).toBe("testlaunchappclip");
    });

    it("should remove target dependency from main target when app clip is removed", () => {
      const xcproj = XcodeProject.open(APP_CLIP_FIXTURE);
      const project = xcproj.rootObject;

      // Get the main target
      const mainTarget = project.props.targets.find(
        (t) =>
          PBXNativeTarget.is(t) &&
          t.props.productType === "com.apple.product-type.application"
      ) as PBXNativeTarget;
      expect(mainTarget).toBeDefined();

      // Verify main target has a dependency on the clip target
      const initialDependencyCount = mainTarget.props.dependencies.length;
      expect(initialDependencyCount).toBeGreaterThan(0);

      // Find the dependency on the clip target
      const clipDependency = mainTarget.props.dependencies.find(
        (dep) =>
          dep.props.target?.uuid === "XX42A75F8F031FED491C16XX" ||
          dep.props.targetProxy?.props.remoteGlobalIDString ===
            "XX42A75F8F031FED491C16XX"
      );
      expect(clipDependency).toBeDefined();

      // Get the app clip target and remove it
      const appClipTarget = xcproj.getObject(
        "XX42A75F8F031FED491C16XX"
      ) as PBXNativeTarget;
      appClipTarget.removeFromProject();

      // Verify the dependency was removed from main target
      expect(mainTarget.props.dependencies.length).toBe(
        initialDependencyCount - 1
      );

      // Verify no dependency references the removed target
      const remainingClipDependency = mainTarget.props.dependencies.find(
        (dep) =>
          dep.props.target?.uuid === "XX42A75F8F031FED491C16XX" ||
          dep.props.targetProxy?.props.remoteGlobalIDString ===
            "XX42A75F8F031FED491C16XX"
      );
      expect(remainingClipDependency).toBeUndefined();
    });

    it("should preserve shared build phases when removing target", () => {
      const xcproj = XcodeProject.open(APP_CLIP_FIXTURE);

      // Get both targets
      const appClipTarget = xcproj.getObject(
        "XX42A75F8F031FED491C16XX"
      ) as PBXNativeTarget;
      const mainTarget = xcproj.rootObject.props.targets.find(
        (t) => PBXNativeTarget.is(t) && t.uuid !== appClipTarget.uuid
      ) as PBXNativeTarget;

      // Find a shared build phase (Bundle React Native code and images)
      const sharedBuildPhaseUuid = "00DD1BFF1BD5951E006B06BC";
      const sharedPhaseInAppClip = appClipTarget.props.buildPhases.find(
        (p) => p.uuid === sharedBuildPhaseUuid
      );
      const sharedPhaseInMain = mainTarget.props.buildPhases.find(
        (p) => p.uuid === sharedBuildPhaseUuid
      );

      expect(sharedPhaseInAppClip).toBeDefined();
      expect(sharedPhaseInMain).toBeDefined();

      // Remove the app clip target
      appClipTarget.removeFromProject();

      // Verify shared build phase still exists
      expect(xcproj.has(sharedBuildPhaseUuid)).toBe(true);

      // Verify main target still has the shared build phase
      expect(
        mainTarget.props.buildPhases.find(
          (p) => p.uuid === sharedBuildPhaseUuid
        )
      ).toBeDefined();
    });

    it("should remove TargetAttributes when target is removed", () => {
      const xcproj = XcodeProject.open(APP_CLIP_FIXTURE);
      const project = xcproj.rootObject;

      // Verify TargetAttributes exists for the app clip target
      expect(
        project.props.attributes?.TargetAttributes?.["XX42A75F8F031FED491C16XX"]
      ).toBeDefined();

      // Get and remove the app clip target
      const appClipTarget = xcproj.getObject(
        "XX42A75F8F031FED491C16XX"
      ) as PBXNativeTarget;
      appClipTarget.removeFromProject();

      // Verify TargetAttributes was removed
      expect(
        project.props.attributes?.TargetAttributes?.["XX42A75F8F031FED491C16XX"]
      ).toBeUndefined();
    });

    it("should remove PBXFileSystemSynchronizedBuildFileExceptionSet when target is removed", () => {
      const xcproj = XcodeProject.open(APP_CLIP_FIXTURE);

      // Verify the exception set exists
      const exceptionSetUuid = "XX01298A2D70B7E6C164BFXX";
      expect(xcproj.has(exceptionSetUuid)).toBe(true);

      // Get and remove the app clip target
      const appClipTarget = xcproj.getObject(
        "XX42A75F8F031FED491C16XX"
      ) as PBXNativeTarget;
      appClipTarget.removeFromProject();

      // Verify the exception set was removed (it was only referenced by the clip's file system group)
      expect(xcproj.has(exceptionSetUuid)).toBe(false);
    });

    it("should remove container item proxy when target dependency is removed", () => {
      const xcproj = XcodeProject.open(APP_CLIP_FIXTURE);

      // Verify the container item proxy exists
      const containerProxyUuid = "XX0A11D0DF5B266A2E8584XX";
      expect(xcproj.has(containerProxyUuid)).toBe(true);

      // Get and remove the app clip target
      const appClipTarget = xcproj.getObject(
        "XX42A75F8F031FED491C16XX"
      ) as PBXNativeTarget;
      appClipTarget.removeFromProject();

      // Verify the container item proxy was removed
      expect(xcproj.has(containerProxyUuid)).toBe(false);
    });

    it("should handle removing a target with no dependencies", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const project = xcproj.rootObject;

      // Create a new standalone target
      const mainTarget = project.getMainAppTarget()!;
      const newTarget = project.createNativeTarget({
        name: "StandaloneTarget",
        productType: "com.apple.product-type.framework",
        buildConfigurationList: mainTarget.props.buildConfigurationList,
      });

      const newTargetUuid = newTarget.uuid;
      expect(xcproj.has(newTargetUuid)).toBe(true);

      // Remove the standalone target
      newTarget.removeFromProject();

      // Verify target was removed
      expect(xcproj.has(newTargetUuid)).toBe(false);
      expect(
        project.props.targets.find((t) => t.uuid === newTargetUuid)
      ).toBeUndefined();
    });

    it("should not remove build configuration list if shared", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const project = xcproj.rootObject;

      // Create two targets sharing the same build configuration list
      const mainTarget = project.getMainAppTarget()!;
      const sharedConfigList = mainTarget.props.buildConfigurationList;

      const target1 = project.createNativeTarget({
        name: "Target1",
        productType: "com.apple.product-type.framework",
        buildConfigurationList: sharedConfigList,
      });

      const target2 = project.createNativeTarget({
        name: "Target2",
        productType: "com.apple.product-type.framework",
        buildConfigurationList: sharedConfigList,
      });

      // Remove target1
      target1.removeFromProject();

      // Verify shared config list still exists (used by mainTarget and target2)
      expect(xcproj.has(sharedConfigList.uuid)).toBe(true);

      // Verify target2 still has the config list
      expect(target2.props.buildConfigurationList.uuid).toBe(
        sharedConfigList.uuid
      );
    });
  });
});
