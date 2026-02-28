import path from "path";

import {
  PBXBuildFile,
  PBXCopyFilesBuildPhase,
  PBXFileReference,
  XCBuildConfiguration,
  XCConfigurationList,
  XcodeProject,
} from "..";

const WORKING_FIXTURE = path.join(
  __dirname,
  "../../json/__tests__/fixtures/AFNetworking.pbxproj"
);
const RN_FIXTURE = path.join(
  __dirname,
  "../../json/__tests__/fixtures/project-rn74.pbxproj"
);

it(`adds PBXCopyFilesBuildPhase for Watch app`, () => {
  const xcproj = XcodeProject.open(WORKING_FIXTURE);

  // Watch apps use wrapper.application file type, but we use .appex extension
  // to trigger the isAppExtension() check in setupDefaults
  const fileRef = PBXFileReference.create(xcproj, {
    path: "Watchy.appex",
    lastKnownFileType: "wrapper.app-extension",
  });
  const file = PBXBuildFile.create(xcproj, {
    fileRef,
    settings: {
      ATTRIBUTES: ["RemoveHeadersOnCopy"],
    },
  });

  const target = xcproj.rootObject.createNativeTarget({
    buildConfigurationList: XCConfigurationList.create(xcproj, {
      defaultConfigurationName: "Release",
      buildConfigurations: [
        XCBuildConfiguration.create(xcproj, {
          name: "Release",
          buildSettings: {
            INFOPLIST_FILE: "Watchy/Info.plist",
            PRODUCT_BUNDLE_IDENTIFIER: "com.example.app.watchkitapp",
            WATCHOS_DEPLOYMENT_TARGET: "6.0",
          },
        }),
        XCBuildConfiguration.create(xcproj, {
          name: "Debug",
          buildSettings: {
            INFOPLIST_FILE: "Watchy/Info.plist",
            PRODUCT_BUNDLE_IDENTIFIER: "com.example.app.watchkitapp",
            WATCHOS_DEPLOYMENT_TARGET: "6.0",
          },
        }),
      ],
    }),
    name: "Watchy",
    productName: "Watchy",
    productType: "com.apple.product-type.application.watchapp2",
    productReference: fileRef,
  });

  xcproj.rootObject.ensureProductGroup().props.children.push(fileRef);

  expect(fileRef.getTargetReferrers()).toEqual([target]);

  const phase = target.createBuildPhase(PBXCopyFilesBuildPhase, {
    files: [file],
  });

  expect(phase.props).toEqual(
    expect.objectContaining({
      buildActionMask: 2147483647,
      dstPath: "$(CONTENTS_FOLDER_PATH)/Watch",
      dstSubfolderSpec: 16,
      files: expect.anything(),
      isa: "PBXCopyFilesBuildPhase",
      name: "Embed Watch Content",
      runOnlyForDeploymentPostprocessing: 0,
    })
  );
});

it(`adds PBXCopyFilesBuildPhase for any extension`, () => {
  const xcproj = XcodeProject.open(WORKING_FIXTURE);

  const fileRef = PBXFileReference.create(xcproj, {
    path: "Watchy.appex",
  });
  const file = PBXBuildFile.create(xcproj, {
    fileRef,
    settings: {
      ATTRIBUTES: ["RemoveHeadersOnCopy"],
    },
  });

  const target = xcproj.rootObject.createNativeTarget({
    buildConfigurationList: XCConfigurationList.create(xcproj, {
      defaultConfigurationName: "Release",
      buildConfigurations: [
        XCBuildConfiguration.create(xcproj, {
          name: "Release",
          buildSettings: {
            INFOPLIST_FILE: "stendo/Info.plist",
            PRODUCT_BUNDLE_IDENTIFIER: "com.example.app.stendo",
            MARKETING_VERSION: 1,
          },
        }),
        XCBuildConfiguration.create(xcproj, {
          name: "Debug",
          buildSettings: {
            INFOPLIST_FILE: "stendo/Info.plist",
            PRODUCT_BUNDLE_IDENTIFIER: "com.example.app.stendo",
            MARKETING_VERSION: 1,
          },
        }),
      ],
    }),
    name: "stendo",
    productName: "stendo",
    productType: "com.apple.product-type.app-extension",
    productReference: fileRef,
  });

  xcproj.rootObject.ensureProductGroup().props.children.push(fileRef);

  expect(fileRef.getTargetReferrers()).toEqual([target]);

  const phase = target.createBuildPhase(PBXCopyFilesBuildPhase, {
    files: [file],
  });

  expect(phase.props).toEqual(
    expect.objectContaining({
      buildActionMask: 2147483647,
      dstPath: "",
      dstSubfolderSpec: 13,
      files: expect.anything(),
      isa: "PBXCopyFilesBuildPhase",
      name: "Embed Foundation Extensions",
      runOnlyForDeploymentPostprocessing: 0,
    })
  );
});

it(`adds PBXCopyFilesBuildPhase for App Clip extension`, () => {
  const xcproj = XcodeProject.open(WORKING_FIXTURE);

  const fileRef = PBXFileReference.create(xcproj, {
    path: "Watchy.appex",
  });
  const file = PBXBuildFile.create(xcproj, {
    fileRef,
    settings: {
      ATTRIBUTES: ["RemoveHeadersOnCopy"],
    },
  });

  const target = xcproj.rootObject.createNativeTarget({
    buildConfigurationList: XCConfigurationList.create(xcproj, {
      defaultConfigurationName: "Release",
      buildConfigurations: [
        XCBuildConfiguration.create(xcproj, {
          name: "Release",
          buildSettings: {
            INFOPLIST_FILE: "stendo/Info.plist",
            PRODUCT_BUNDLE_IDENTIFIER: "com.example.app.stendo",
            MARKETING_VERSION: 1,
          },
        }),
        XCBuildConfiguration.create(xcproj, {
          name: "Debug",
          buildSettings: {
            INFOPLIST_FILE: "stendo/Info.plist",
            PRODUCT_BUNDLE_IDENTIFIER: "com.example.app.stendo",
            MARKETING_VERSION: 1,
          },
        }),
      ],
    }),
    name: "stendo",
    productName: "stendo",
    productType: "com.apple.product-type.application.on-demand-install-capable",
    productReference: fileRef,
  });

  xcproj.rootObject.ensureProductGroup().props.children.push(fileRef);

  expect(fileRef.getTargetReferrers()).toEqual([target]);

  const phase = target.createBuildPhase(PBXCopyFilesBuildPhase, {
    files: [file],
  });

  expect(phase.props).toEqual(
    expect.objectContaining({
      buildActionMask: 2147483647,
      dstPath: "$(CONTENTS_FOLDER_PATH)/AppClips",
      dstSubfolderSpec: 16,
      files: expect.anything(),
      isa: "PBXCopyFilesBuildPhase",
      name: "Embed App Clips",
      runOnlyForDeploymentPostprocessing: 0,
    })
  );
});
it(`adds PBXCopyFilesBuildPhase for ExtensionKit extension`, () => {
  const xcproj = XcodeProject.open(WORKING_FIXTURE);

  const fileRef = PBXFileReference.create(xcproj, {
    path: "stendo.appex",
  });
  const file = PBXBuildFile.create(xcproj, {
    fileRef,
    settings: {
      ATTRIBUTES: ["RemoveHeadersOnCopy"],
    },
  });

  const target = xcproj.rootObject.createNativeTarget({
    buildConfigurationList: XCConfigurationList.create(xcproj, {
      defaultConfigurationName: "Release",
      buildConfigurations: [
        XCBuildConfiguration.create(xcproj, {
          name: "Release",
          buildSettings: {
            INFOPLIST_FILE: "stendo/Info.plist",
            PRODUCT_BUNDLE_IDENTIFIER: "com.example.app.stendo",
            MARKETING_VERSION: 1,
          },
        }),
        XCBuildConfiguration.create(xcproj, {
          name: "Debug",
          buildSettings: {
            INFOPLIST_FILE: "stendo/Info.plist",
            PRODUCT_BUNDLE_IDENTIFIER: "com.example.app.stendo",
            MARKETING_VERSION: 1,
          },
        }),
      ],
    }),
    name: "stendo",
    productName: "stendo",
    productType: "com.apple.product-type.extensionkit-extension",
    productReference: fileRef,
  });

  xcproj.rootObject.ensureProductGroup().props.children.push(fileRef);

  expect(fileRef.getTargetReferrers()).toEqual([target]);

  const phase = target.createBuildPhase(PBXCopyFilesBuildPhase, {
    files: [file],
  });

  expect(phase.props).toEqual(
    expect.objectContaining({
      buildActionMask: 2147483647,
      dstPath: "$(EXTENSIONS_FOLDER_PATH)",
      dstSubfolderSpec: 16,
      files: expect.anything(),
      isa: "PBXCopyFilesBuildPhase",
      name: "Embed ExtensionKit Extensions",
      runOnlyForDeploymentPostprocessing: 0,
    })
  );
});

// Test the idempotent invocation.
it(`adds PBXCopyFilesBuildPhase for ExtensionKit extension from main target`, () => {
  const xcproj = XcodeProject.open(RN_FIXTURE);

  const fileRef = PBXFileReference.create(xcproj, {
    path: "stendo.appex",
  });
  const file = PBXBuildFile.create(xcproj, {
    fileRef,
    settings: {
      ATTRIBUTES: ["RemoveHeadersOnCopy"],
    },
  });

  const target = xcproj.rootObject.createNativeTarget({
    buildConfigurationList: XCConfigurationList.create(xcproj, {
      defaultConfigurationName: "Release",
      buildConfigurations: [
        XCBuildConfiguration.create(xcproj, {
          name: "Release",
          buildSettings: {
            INFOPLIST_FILE: "stendo/Info.plist",
            PRODUCT_BUNDLE_IDENTIFIER: "com.example.app.stendo",
            MARKETING_VERSION: 1,
          },
        }),
        XCBuildConfiguration.create(xcproj, {
          name: "Debug",
          buildSettings: {
            INFOPLIST_FILE: "stendo/Info.plist",
            PRODUCT_BUNDLE_IDENTIFIER: "com.example.app.stendo",
            MARKETING_VERSION: 1,
          },
        }),
      ],
    }),
    name: "stendo",
    productName: "stendo",
    productType: "com.apple.product-type.extensionkit-extension",
    productReference: fileRef,
  });

  xcproj.rootObject.ensureProductGroup().props.children.push(fileRef);

  expect(fileRef.getTargetReferrers()).toEqual([target]);

  const mainTarget = xcproj.rootObject.getMainAppTarget();

  const phase = mainTarget!.getCopyBuildPhaseForTarget(target);

  phase.props.files.push(file);

  expect(phase.props).toEqual(
    expect.objectContaining({
      buildActionMask: 2147483647,
      dstPath: "$(EXTENSIONS_FOLDER_PATH)",
      dstSubfolderSpec: 16,
      files: expect.anything(),
      isa: "PBXCopyFilesBuildPhase",
      name: "Embed ExtensionKit Extensions",
      runOnlyForDeploymentPostprocessing: 0,
    })
  );
});
