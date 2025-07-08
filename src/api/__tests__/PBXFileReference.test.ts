import path from "path";

import {
  PBXContainerItemProxy,
  PBXFileReference,
  XcodeProject,
  PBXGroup,
  PBXBuildFile,
  PBXNativeTarget,
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

describe("PBXFileReference", () => {
  describe("creation and UUIDs", () => {
    it("adds deterministic UUIDs without collision", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);

      // @ts-expect-error: Prove that adding a random UUID to the project doesn't change the UUIDs of other objects
      xcproj.set(Math.random().toString(), {});

      const containerItemProxy = PBXContainerItemProxy.create(xcproj, {
        containerPortal: xcproj.rootObject,
        proxyType: 1,
        remoteGlobalIDString: "xxx",
        remoteInfo: "xxx",
      });
      expect(containerItemProxy.uuid).toBe("XX6D16E1EEB44DF363DCC9XX");

      const ref = PBXFileReference.create(xcproj, {
        path: "a.swift",
      });

      expect(ref.uuid).toBe("XXDBE740AD7C410FE2DF44XX");
      expect(
        PBXFileReference.create(xcproj, {
          path: "a.swift",
        }).uuid
      ).toBe("XX5BBE738DD91F7523452AXX");
    });

    it("should create file reference with minimal options", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const ref = PBXFileReference.create(xcproj, {
        path: "TestFile.swift",
      });

      expect(ref).toBeDefined();
      expect(ref.props.path).toBe("TestFile.swift");
      expect(ref.props.isa).toBe("PBXFileReference");
    });
  });

  describe("setupDefaults", () => {
    it("adds framework file with correct defaults for name", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);

      const ref = PBXFileReference.create(xcproj, {
        path: "System/Library/Frameworks/SwiftUI.framework",
      });

      expect(ref.uuid).toBe("XX4DFF38D47332D6BF0183XX");

      expect(ref.props).toEqual({
        fileEncoding: 4,
        includeInIndex: undefined,
        isa: "PBXFileReference",
        name: "SwiftUI.framework",
        path: "System/Library/Frameworks/SwiftUI.framework",
        lastKnownFileType: "wrapper.framework",
        sourceTree: "SDKROOT",
      });
    });

    it("should set default file encoding", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const ref = PBXFileReference.create(xcproj, {
        path: "test.swift",
      });

      expect(ref.props.fileEncoding).toBe(4);
    });

    it("should set includeInIndex for regular files", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const ref = PBXFileReference.create(xcproj, {
        path: "test.swift",
      });

      expect(ref.props.includeInIndex).toBe(0);
    });

    it("should clear includeInIndex for framework files", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const ref = PBXFileReference.create(xcproj, {
        path: "TestFramework.framework",
      });

      expect(ref.props.includeInIndex).toBeUndefined();
    });

    it("should set name from path basename when different", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const ref = PBXFileReference.create(xcproj, {
        path: "folder/subfolder/test.swift",
      });

      expect(ref.props.name).toBe("test.swift");
    });

    it("should not set name when same as path", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const ref = PBXFileReference.create(xcproj, {
        path: "test.swift",
      });

      // When path basename equals path, name should NOT be set (this is the actual behavior)
      expect(ref.props.name).toBeUndefined();
    });
  });

  describe("file type detection", () => {
    const xcproj = XcodeProject.open(WORKING_FIXTURE);

    it("adds swift file", () => {
      const ref = PBXFileReference.create(xcproj, {
        path: "fun/funky.swift",
      });

      expect(ref.props).toEqual({
        fileEncoding: 4,
        includeInIndex: 0,
        isa: "PBXFileReference",
        lastKnownFileType: "sourcecode.swift",
        name: "funky.swift",
        path: "fun/funky.swift",
        sourceTree: "<group>",
      });
    });

    it("adds css file", () => {
      const ref = PBXFileReference.create(xcproj, {
        path: "fun/funky.css",
      });

      expect(ref.props).toEqual({
        fileEncoding: 4,
        includeInIndex: 0,
        isa: "PBXFileReference",
        lastKnownFileType: "text.css",
        name: "funky.css",
        path: "fun/funky.css",
        sourceTree: "<group>",
      });
    });

    it("adds html file", () => {
      const ref = PBXFileReference.create(xcproj, {
        path: "fun/funky.html",
      });

      expect(ref.props).toEqual({
        fileEncoding: 4,
        includeInIndex: 0,
        isa: "PBXFileReference",
        lastKnownFileType: "text.html",
        name: "funky.html",
        path: "fun/funky.html",
        sourceTree: "<group>",
      });
    });

    it("adds json file", () => {
      const ref = PBXFileReference.create(xcproj, {
        path: "fun/funky.json",
      });

      expect(ref.props).toEqual({
        fileEncoding: 4,
        includeInIndex: 0,
        isa: "PBXFileReference",
        lastKnownFileType: "text.json",
        name: "funky.json",
        path: "fun/funky.json",
        sourceTree: "<group>",
      });
    });

    it("adds js file", () => {
      const ref = PBXFileReference.create(xcproj, {
        path: "fun/funky.js",
      });

      expect(ref.props).toEqual({
        fileEncoding: 4,
        includeInIndex: 0,
        isa: "PBXFileReference",
        lastKnownFileType: "sourcecode.javascript",
        name: "funky.js",
        path: "fun/funky.js",
        sourceTree: "<group>",
      });
    });

    it("adds random file without extension", () => {
      const ref = PBXFileReference.create(xcproj, {
        path: "fun/funky",
      });

      expect(ref.props).toEqual({
        fileEncoding: 4,
        includeInIndex: 0,
        isa: "PBXFileReference",
        name: "funky",
        path: "fun/funky",
        sourceTree: "<group>",
      });
    });

    it("should handle .m Objective-C files", () => {
      const ref = PBXFileReference.create(xcproj, {
        path: "TestFile.m",
      });

      expect(ref.props.lastKnownFileType).toBe("sourcecode.c.objc");
    });

    it("should handle .h header files", () => {
      const ref = PBXFileReference.create(xcproj, {
        path: "TestFile.h",
      });

      expect(ref.props.lastKnownFileType).toBe("sourcecode.c.h");
    });
  });

  describe("setLastKnownFileType", () => {
    it("should set file type manually", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const ref = PBXFileReference.create(xcproj, {
        path: "test.unknown",
      });

      ref.setLastKnownFileType("sourcecode.swift");
      expect(ref.props.lastKnownFileType).toBe("sourcecode.swift");
    });

    it("should detect file type from extension", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const ref = PBXFileReference.create(xcproj, {
        path: "test.unknown",
      });

      // Clear the automatically set type
      ref.props.lastKnownFileType = undefined;

      // Change path and detect type
      ref.props.path = "test.swift";
      ref.setLastKnownFileType();
      expect(ref.props.lastKnownFileType).toBe("sourcecode.swift");
    });

    it("should handle files without extensions", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const ref = PBXFileReference.create(xcproj, {
        path: "README",
      });

      ref.setLastKnownFileType();
      expect(ref.props.lastKnownFileType).toBeUndefined();
    });
  });

  describe("setExplicitFileType", () => {
    it("should set explicit file type manually", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const ref = PBXFileReference.create(xcproj, {
        path: "test.swift",
      });

      ref.setExplicitFileType("wrapper.application");
      expect(ref.props.explicitFileType).toBe("wrapper.application");
      expect(ref.props.lastKnownFileType).toBeUndefined();
    });

    it("should detect explicit file type from extension", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const ref = PBXFileReference.create(xcproj, {
        path: "test.app",
      });

      ref.setExplicitFileType();
      expect(ref.props.explicitFileType).toBe("wrapper.application");
      expect(ref.props.lastKnownFileType).toBeUndefined();
    });

    it("should clear lastKnownFileType when explicitFileType is set", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const ref = PBXFileReference.create(xcproj, {
        path: "test.swift",
      });

      expect(ref.props.lastKnownFileType).toBe("sourcecode.swift");

      ref.setExplicitFileType("wrapper.application");
      expect(ref.props.explicitFileType).toBe("wrapper.application");
      expect(ref.props.lastKnownFileType).toBeUndefined();
    });
  });

  describe("getDisplayName", () => {
    it("should return name property when set", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const ref = PBXFileReference.create(xcproj, {
        path: "folder/test.swift",
        name: "CustomName.swift",
      });

      expect(ref.getDisplayName()).toBe("CustomName.swift");
    });

    it("should return path for BUILT_PRODUCTS_DIR", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const ref = PBXFileReference.create(xcproj, {
        path: "MyApp.app",
        sourceTree: "BUILT_PRODUCTS_DIR",
      });

      expect(ref.getDisplayName()).toBe("MyApp.app");
    });

    it("should return basename of path when no name", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const ref = PBXFileReference.create(xcproj, {
        path: "folder/subfolder/test.swift",
      });

      // Remove name to test fallback
      ref.props.name = undefined;
      expect(ref.getDisplayName()).toBe("test.swift");
    });

    it("should return fallback ISA name when no path or name", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const ref = PBXFileReference.create(xcproj, {
        path: "test.swift",
      });

      // Remove both name and path
      ref.props.name = undefined;
      ref.props.path = undefined;
      expect(ref.getDisplayName()).toBe("FileReference");
    });
  });

  describe("path management", () => {
    it("should get parent group", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const mainGroup = xcproj.rootObject.props.mainGroup;
      const ref = mainGroup.createFile({
        path: "test.swift",
      });

      const parent = ref.getParent();
      expect(parent).toBe(mainGroup);
    });

    it("should get all parents", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const mainGroup = xcproj.rootObject.props.mainGroup;
      const subGroup = mainGroup.createGroup({
        name: "SubGroup",
        sourceTree: "<group>",
      });
      const ref = subGroup.createFile({
        path: "test.swift",
      });

      const parents = ref.getParents();
      expect(parents).toContain(subGroup);
      expect(parents).toContain(mainGroup);
    });

    it("should move to different parent", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const mainGroup = xcproj.rootObject.props.mainGroup;
      const group1 = mainGroup.createGroup({
        name: "Group1",
        sourceTree: "<group>",
      });
      const group2 = mainGroup.createGroup({
        name: "Group2",
        sourceTree: "<group>",
      });

      const ref = group1.createFile({
        path: "test.swift",
      });

      expect(ref.getParent()).toBe(group1);

      ref.move(group2);
      expect(ref.getParent()).toBe(group2);
      expect(group1.props.children).not.toContain(ref);
      expect(group2.props.children).toContain(ref);
    });

    it("should set path with source tree", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const mainGroup = xcproj.rootObject.props.mainGroup;
      const ref = mainGroup.createFile({
        path: "test.swift",
      });

      ref.setPath("new/path/test.swift");
      // The setPath method resolves paths to absolute paths for most source trees
      expect(ref.props.path).toContain("new/path/test.swift");
    });

    it("should clear path when undefined", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const ref = PBXFileReference.create(xcproj, {
        path: "test.swift",
      });

      ref.setPath(undefined);
      expect(ref.props.path).toBeUndefined();
    });
  });

  describe("getBuildFiles", () => {
    it("should return build files that reference this file", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const target = xcproj.rootObject.getMainAppTarget();
      expect(target).toBeDefined();

      // Create a file reference
      const mainGroup = xcproj.rootObject.props.mainGroup;
      const ref = mainGroup.createFile({
        path: "TestFile.swift",
      });

      // Add it to sources build phase
      const sourcesPhase = target!.getSourcesBuildPhase();
      const buildFile = sourcesPhase.ensureFile({ fileRef: ref });

      const buildFiles = ref.getBuildFiles();
      expect(buildFiles).toContain(buildFile);
      expect(buildFiles.length).toBeGreaterThan(0);
    });

    it("should return empty array for files not in build phases", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const mainGroup = xcproj.rootObject.props.mainGroup;
      const ref = mainGroup.createFile({
        path: "UnusedFile.swift",
      });

      const buildFiles = ref.getBuildFiles();
      expect(buildFiles).toEqual([]);
    });
  });

  describe("getTargetReferrers", () => {
    it("should return targets that reference this file as product", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const target = xcproj.rootObject.getMainAppTarget();
      expect(target).toBeDefined();

      if (target!.props.productReference) {
        const productRef = target!.props.productReference;
        const targetReferrers = productRef.getTargetReferrers();
        expect(targetReferrers).toContain(target);
      }
    });

    it("should return empty array for non-product files", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const mainGroup = xcproj.rootObject.props.mainGroup;
      const ref = mainGroup.createFile({
        path: "RegularFile.swift",
      });

      const targetReferrers = ref.getTargetReferrers();
      expect(targetReferrers).toEqual([]);
    });
  });

  describe("isAppExtension", () => {
    it("should return true for app extension files", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const ref = PBXFileReference.create(xcproj, {
        path: "MyExtension.appex",
        lastKnownFileType: "wrapper.app-extension",
        sourceTree: "BUILT_PRODUCTS_DIR",
      });

      expect(ref.isAppExtension()).toBe(true);
    });

    it("should return true for ExtensionKit extension files", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const ref = PBXFileReference.create(xcproj, {
        path: "MyExtension.appex",
        lastKnownFileType: "wrapper.extensionkit-extension",
        sourceTree: "BUILT_PRODUCTS_DIR",
      });

      expect(ref.isAppExtension()).toBe(true);
    });

    it("should return true for explicit file type app extensions", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const ref = PBXFileReference.create(xcproj, {
        path: "MyExtension.appex",
        explicitFileType: "wrapper.app-extension",
        sourceTree: "BUILT_PRODUCTS_DIR",
      });

      expect(ref.isAppExtension()).toBe(true);
    });

    it("should return false for app extension files not in BUILT_PRODUCTS_DIR", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const ref = PBXFileReference.create(xcproj, {
        path: "MyExtension.appex",
        lastKnownFileType: "wrapper.app-extension",
        sourceTree: "<group>",
      });

      expect(ref.isAppExtension()).toBe(false);
    });

    it("should return false for regular application files", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const ref = PBXFileReference.create(xcproj, {
        path: "MyApp.app",
        lastKnownFileType: "wrapper.application",
        sourceTree: "BUILT_PRODUCTS_DIR",
      });

      expect(ref.isAppExtension()).toBe(false);
    });

    it("should return false for source files", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const ref = PBXFileReference.create(xcproj, {
        path: "test.swift",
        lastKnownFileType: "sourcecode.swift",
        sourceTree: "<group>",
      });

      expect(ref.isAppExtension()).toBe(false);
    });
  });

  describe("proxy and container methods", () => {
    it("should return empty array for getProxyContainers on regular files", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const ref = PBXFileReference.create(xcproj, {
        path: "test.swift",
      });

      const containers = ref.getProxyContainers();
      expect(containers).toEqual([]);
    });

    it("should return empty array for getTargetDependencyProxies on regular files", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const ref = PBXFileReference.create(xcproj, {
        path: "test.swift",
      });

      const proxies = ref.getTargetDependencyProxies();
      expect(proxies).toEqual([]);
    });

    it("should return empty array for getFileReferenceProxies on regular files", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const ref = PBXFileReference.create(xcproj, {
        path: "test.swift",
      });

      const proxies = ref.getFileReferenceProxies();
      expect(proxies).toEqual([]);
    });
  });

  describe("removeFromProject", () => {
    it("should remove file and all related build files", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const target = xcproj.rootObject.getMainAppTarget();
      expect(target).toBeDefined();

      // Create a file reference and add to build phase
      const mainGroup = xcproj.rootObject.props.mainGroup;
      const ref = mainGroup.createFile({
        path: "ToBeRemoved.swift",
      });

      const sourcesPhase = target!.getSourcesBuildPhase();
      const buildFile = sourcesPhase.ensureFile({ fileRef: ref });

      expect(sourcesPhase.props.files).toContain(buildFile);
      expect(mainGroup.props.children).toContain(ref);

      // Store the build file UUID for checking
      const buildFileUuid = buildFile.uuid;

      // Remove the file reference
      ref.removeFromProject();

      // Should be removed from group
      expect(mainGroup.props.children).not.toContain(ref);

      // Check that build file is removed from the project entirely
      expect(xcproj.get(buildFileUuid)).toBeUndefined();
    });

    it("should remove file without build files", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const mainGroup = xcproj.rootObject.props.mainGroup;
      const ref = mainGroup.createFile({
        path: "UnusedFile.swift",
      });

      expect(mainGroup.props.children).toContain(ref);

      ref.removeFromProject();
      expect(mainGroup.props.children).not.toContain(ref);
    });
  });

  describe("source tree handling", () => {
    it("should use SDKROOT for system frameworks", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const ref = PBXFileReference.create(xcproj, {
        path: "System/Library/Frameworks/UIKit.framework",
      });

      expect(ref.props.sourceTree).toBe("SDKROOT");
    });

    it("should use <group> for regular source files", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const ref = PBXFileReference.create(xcproj, {
        path: "ViewController.swift",
      });

      expect(ref.props.sourceTree).toBe("<group>");
    });

    it("should use BUILT_PRODUCTS_DIR for explicit file type", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const ref = PBXFileReference.create(xcproj, {
        path: "MyApp.app",
        explicitFileType: "wrapper.application",
      });

      expect(ref.props.sourceTree).toBe("BUILT_PRODUCTS_DIR");
    });
  });

  describe("integration tests", () => {
    it("should handle complete file lifecycle", () => {
      const xcproj = XcodeProject.open(MULTITARGET_FIXTURE);
      const target = xcproj.rootObject.getMainAppTarget();
      const mainGroup = xcproj.rootObject.props.mainGroup;

      // Create file
      const ref = mainGroup.createFile({
        path: "CompleteTest.swift",
      });

      // Verify creation
      expect(ref.getDisplayName()).toBe("CompleteTest.swift");
      expect(ref.props.lastKnownFileType).toBe("sourcecode.swift");
      expect(ref.getParent()).toBe(mainGroup);

      // Add to build phase
      const sourcesPhase = target!.getSourcesBuildPhase();
      sourcesPhase.ensureFile({ fileRef: ref });

      // Verify it's in build files
      expect(ref.getBuildFiles().length).toBeGreaterThan(0);

      // Move to different group
      const newGroup = mainGroup.createGroup({
        name: "NewGroup",
        sourceTree: "<group>",
      });
      ref.move(newGroup);
      expect(ref.getParent()).toBe(newGroup);

      // Modify file type
      ref.setLastKnownFileType("text.json");
      expect(ref.props.lastKnownFileType).toBe("text.json");

      // Remove from project
      ref.removeFromProject();
      expect(newGroup.props.children).not.toContain(ref);
    });

    it("should work across different project fixtures", () => {
      const fixtures = [WORKING_FIXTURE, MULTITARGET_FIXTURE, WATCH_FIXTURE];

      fixtures.forEach((fixture) => {
        const xcproj = XcodeProject.open(fixture);

        // Create a test file in each project
        const mainGroup = xcproj.rootObject.props.mainGroup;
        const ref = mainGroup.createFile({
          path: "CrossProjectTest.swift",
        });

        // Basic functionality should work
        expect(ref.getDisplayName()).toBe("CrossProjectTest.swift");
        expect(ref.props.lastKnownFileType).toBe("sourcecode.swift");
        expect(ref.getParent()).toBe(mainGroup);
        expect(typeof ref.isAppExtension()).toBe("boolean");
        expect(Array.isArray(ref.getBuildFiles())).toBe(true);
        expect(Array.isArray(ref.getTargetReferrers())).toBe(true);
      });
    });

    it("should handle different file types properly", () => {
      const xcproj = XcodeProject.open(WORKING_FIXTURE);
      const fileTypes = [
        { path: "test.swift", expectedType: "sourcecode.swift" },
        { path: "test.m", expectedType: "sourcecode.c.objc" },
        { path: "test.h", expectedType: "sourcecode.c.h" },
        { path: "test.js", expectedType: "sourcecode.javascript" },
        { path: "test.css", expectedType: "text.css" },
        { path: "test.html", expectedType: "text.html" },
        { path: "test.json", expectedType: "text.json" },
        { path: "TestFramework.framework", expectedType: "wrapper.framework" },
      ];

      fileTypes.forEach(({ path, expectedType }) => {
        const ref = PBXFileReference.create(xcproj, { path });
        expect(ref.props.lastKnownFileType).toBe(expectedType);
      });
    });
  });
});
