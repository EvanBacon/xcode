// import assert from "assert";
// import { build } from "../../json";
// import {
//   XcodeProject,
//   PBXCopyFilesBuildPhase,
//   PBXGroup,
//   PBXResourcesBuildPhase,
//   PBXSourcesBuildPhase,
//   PBXNativeTarget,
//   PBXShellScriptBuildPhase,
//   PBXFrameworksBuildPhase,
// } from "..";
// import { getRealPath } from "../utils/paths";
// import fixture from "../../json/__tests__/fixtures/project";

// function addBuildPhase(target: PBXNativeTarget) {
//   target.createBuildPhase(PBXShellScriptBuildPhase, {
//     name: "Start Packager",
//     shellScript: `export RCT_METRO_PORT=\"\${RCT_METRO_PORT:=8081}\"\\necho \"export RCT_METRO_PORT=\${RCT_METRO_PORT}\" > \`node --print \"require('path').dirname(require.resolve('react-native/package.json')) + '/scripts/.packager.env'\"\`\\nif [ -z \"\${RCT_NO_LAUNCH_PACKAGER+xxx}\" ] ; then\\n  if nc -w 5 -z localhost \${RCT_METRO_PORT} ; then\\n    if ! curl -s \"http://localhost:\${RCT_METRO_PORT}/status\" | grep -q \"packager-status:running\" ; then\\n      echo \"Port \${RCT_METRO_PORT} already in use, packager is either not running or not running correctly\"\\n      exit 2\\n    fi\\n  else\\n    open \`node --print \"require('path').dirname(require.resolve('react-native/package.json')) + '/scripts/launchPackager.command'\"\` || echo \"Can't start packager automatically\"\\n  fi\\nfi\\n`,
//   });

//   const appTarget = target.project.getNativeTarget(
//     "com.apple.product-type.application"
//   );
//   assert(appTarget, "app target not found");

//   target.createBuildPhase(PBXSourcesBuildPhase, {
//     // Reuse files from app target:
//     // AppDelegate, main, etc.
//     files: appTarget.getBuildPhase(PBXSourcesBuildPhase)!.props.files,
//   });
//   target.createBuildPhase(PBXCopyFilesBuildPhase, {
//     files: [],
//     dstPath: "$(CONTENTS_FOLDER_PATH)/AppClips",
//     dstSubfolderSpec: 16,
//   });
//   target.createBuildPhase(PBXFrameworksBuildPhase, {
//     // dstSubfolderSpec: 16
//   });
//   target.createBuildPhase(PBXResourcesBuildPhase, {
//     files: [
//       // @ts-expect-error
//       "Images.xcassets",
//       // @ts-expect-error
//       "SplashScreen.storyboard",
//       // @ts-expect-error
//       "Supporting/Expo.plist",
//     ],
//     // dstSubfolderSpec: 16
//   });

//   target.createBuildPhase(PBXShellScriptBuildPhase, {
//     name: "Bundle React Native code and images",
//     shellScript: `export NODE_BINARY=node\\n\\n# The project root by default is one level up from the ios directory\\nexport PROJECT_ROOT=\"$PROJECT_DIR\"/..\\n\\n\`node --print \"require('path').dirname(require.resolve('react-native/package.json')) + '/scripts/react-native-xcode.sh'\"\`\\n`,
//   });
// }

// it(`works`, () => {
//   const uuid = "foobar";
//   const project = {
//     rootObject: "83CBB9F71A601CBA00E9B192",
//     objects: {
//       "13B07FB11A68108700A75B9A": {
//         isa: "PBXGroup",
//         children: [
//           // "13B07FB21A68108700A75B9A"
//         ],
//         name: "LaunchScreen.xib",
//         path: "testproject",
//         sourceTree: "<group>",
//       },

//       // [uuid]: {
//       //   isa: "PBXBuildFile",
//       //   fileRef: "13B07FB01A68108700A75B9A",
//       // },
//       // "13B07FB01A68108700A75B9A": {
//       //   isa: "PBXFileReference",
//       //   fileEncoding: 4,
//       //   lastKnownFileType: "sourcecode.c.objc",
//       //   name: "AppDelegate.m",
//       //   path: "testproject/AppDelegate.m",
//       //   sourceTree: "<group>",
//       // },

//       "83CBB9F71A601CBA00E9B192": {
//         isa: "PBXProject",
//         attributes: {
//           LastUpgradeCheck: 1130,
//           TargetAttributes: {
//             // "13B07F861A680F5B00A75B9A": { LastSwiftMigration: 1120 },
//           },
//         },
//         // buildConfigurationList: "83CBB9FA1A601CBA00E9B192",
//         compatibilityVersion: "Xcode 3.2",
//         developmentRegion: "en",
//         hasScannedForEncodings: 0,
//         knownRegions: ["en", "Base"],
//         // mainGroup: "83CBB9F61A601CBA00E9B192",
//         // productRefGroup: "83CBBA001A601CBA00E9B192",
//         projectDirPath: "",
//         projectRoot: "",
//         // targets: ["13B07F861A680F5B00A75B9A"],
//       },
//     },
//   };
//   const xcproject = new XcodeProject(
//     "/foo/bar/project.pbxproj",
//     // @ts-ignore
//     // project
//     fixture
//   );

//   const target = xcproject.rootObject.getNativeTarget(
//     "com.apple.product-type.application"
//   );
//   assert(target, "app target not found");
//   // console.log("target", target);

//   const phase = target.getBuildPhase(PBXResourcesBuildPhase);
//   assert(phase, "app target resource build phase not found");

//   // Link file to res phase
//   // phase.createFile({ fileRef: file.uuid });
//   // console.log("phase", phase);

//   const subfolder = "AppClips";
//   const bundleId = "app.bacon.app";
//   const bundleName = "Foobar";

//   const PRODUCT_BUNDLE_IDENTIFIER = `"${bundleId}.${bundleName}"`;
//   const INFOPLIST_FILE = `"${subfolder}/Info.plist"`;
//   const CODE_SIGN_ENTITLEMENTS = `"${subfolder}/${subfolder}.entitlements"`;

//   const commonBuildSettings = {
//     // CLANG_ANALYZER_NONNULL: "YES",
//     // CLANG_ANALYZER_NUMBER_OBJECT_CONVERSION: "YES_AGGRESSIVE",
//     // CLANG_CXX_LANGUAGE_STANDARD: "gnu++14",
//     // CLANG_ENABLE_OBJC_WEAK: "YES",
//     // CLANG_WARN_DOCUMENTATION_COMMENTS: "YES",
//     // CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER: "YES",
//     // CLANG_WARN_UNGUARDED_AVAILABILITY: "YES_AGGRESSIVE",
//     // CODE_SIGN_STYLE: "Automatic",
//     // DEBUG_INFORMATION_FORMAT: "dwarf",
//     // GCC_C_LANGUAGE_STANDARD: "gnu11",
//     // INFOPLIST_FILE: "foobar/Info.plist",
//     // MTL_FAST_MATH: "YES",
//     // SKIP_INSTALL: "YES",
//     ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME: "AccentColor",
//     CLANG_ANALYZER_NONNULL: "YES",
//     CLANG_ANALYZER_NUMBER_OBJECT_CONVERSION: "YES_AGGRESSIVE",
//     CLANG_CXX_LANGUAGE_STANDARD: `"gnu++17"`,
//     CLANG_ENABLE_OBJC_WEAK: "YES",
//     CLANG_WARN_DOCUMENTATION_COMMENTS: "YES",
//     CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER: "YES",
//     CLANG_WARN_UNGUARDED_AVAILABILITY: "YES_AGGRESSIVE",
//     CODE_SIGN_ENTITLEMENTS,
//     CODE_SIGN_STYLE: "Automatic",
//     CURRENT_PROJECT_VERSION: 1,
//     DEBUG_INFORMATION_FORMAT: "dwarf",
//     SWIFT_VERSION: "5.0",
//     GCC_C_LANGUAGE_STANDARD: "gnu11",
//     // IPHONEOS_DEPLOYMENT_TARGET: "15.4",
//     LD_RUNPATH_SEARCH_PATHS: `$(inherited) @executable_path/Frameworks`,
//     MARKETING_VERSION: "1.0",
//     MTL_ENABLE_DEBUG_INFO: "INCLUDE_SOURCE",
//     MTL_FAST_MATH: "YES",
//     PRODUCT_NAME: `$(TARGET_NAME)`,
//     SWIFT_EMIT_LOC_STRINGS: "YES",
//     TARGETED_DEVICE_FAMILY: `1,2`,
//     ASSETCATALOG_COMPILER_APPICON_NAME: "AppIcon",
//     CLANG_ENABLE_MODULES: "YES",
//     INFOPLIST_FILE,
//     // LD_RUNPATH_SEARCH_PATHS: quoted("$(inherited) @executable_path/Frameworks"),
//     // OTHER_LDFLAGS: `("$(inherited)", "-ObjC", "-lc++")`,
//     PRODUCT_BUNDLE_IDENTIFIER,
//     IPHONEOS_DEPLOYMENT_TARGET: "14.0",
//     VERSIONING_SYSTEM: "apple-generic",
//   } as const;

//   const customList = target.createConfigurationList(
//     {
//       defaultConfigurationName: "Debug",
//     },
//     [
//       {
//         name: "Debug",
//         buildSettings: {
//           ...commonBuildSettings,
//         },
//       },
//       {
//         name: "Release",
//         buildSettings: {
//           ...commonBuildSettings,
//           COPY_PHASE_STRIP: "NO",
//           DEBUG_INFORMATION_FORMAT: `"dwarf-with-dsym"`,
//           GCC_C_LANGUAGE_STANDARD: "gnu11",
//         },
//       },
//     ]
//   );

//   const productsGroup = xcproject.rootObject.ensureProductGroup() as PBXGroup;

//   // productsGroup.props.name;

//   // 		4E2C786008B44EE09BED5442 /* configpluginsappiosstickers Stickers.appex */ = {isa = PBXFileReference; explicitFileType = "wrapper.app-extension"; fileEncoding = undefined; includeInIndex = 0; lastKnownFileType = undefined; name = "configpluginsappiosstickers Stickers.appex"; path = "configpluginsappiosstickers Stickers.appex"; sourceTree = BUILT_PRODUCTS_DIR; };
//   const productFile = productsGroup.createFile({
//     path: "configpluginsappiosstickers Stickers.appex",
//     // BUILT_PRODUCTS_DIR
//     // wrapper.app-extension
//   });

//   const copyBuildPhase = target.createBuildPhase(PBXCopyFilesBuildPhase, {
//     name: "Embed App Extensions",
//   });

//   copyBuildPhase.createFile({
//     fileRef: productFile.uuid,
//     settings: {
//       ATTRIBUTES: ["RemoveHeadersOnCopy"],
//     },
//   });

//   const stickersContentGroup: PBXGroup =
//     xcproject.rootObject.props.mainGroup.createGroup({
//       name: "configpluginsappiosstickers Stickers",
//     });

//   // 		CDD67478BF1C444B9D0DBA69 /* Stickers.xcassets */ = {isa = PBXFileReference; explicitFileType = undefined; fileEncoding = undefined; includeInIndex = 0; lastKnownFileType = folder.assetcatalog; name = Stickers.xcassets; path = Stickers.xcassets; sourceTree = "<group>"; };
//   const stickersAssetsFile = stickersContentGroup.createFile({
//     path: "Stickers.xcassets",
//   });

//   const stickerTarget = xcproject.rootObject.createNativeTarget({
//     name: "configpluginsappiosstickers Stickers",
//     // TODO: Fix
//     buildConfigurationList: customList.uuid,
//     productType: "com.apple.product-type.app-extension.messages-sticker-pack",
//     buildPhases: [],
//     // TODO: Fix
//     productReference: productFile.uuid,
//   });

//   // DA40303D4F9E17E52446A560
//   // TODO: unclear if this is needed
//   const sourcesPhase = target.createBuildPhase(PBXSourcesBuildPhase);

//   // FA483877FE904A34A3661154
//   const resourcesPhase = target.createBuildPhase(PBXResourcesBuildPhase);

//   target.props.buildPhases.push(copyBuildPhase);

//   resourcesPhase.createFile({
//     fileRef: stickersAssetsFile.uuid,
//   });

//   // For fun ig
//   if (!xcproject.rootObject.props.attributes.TargetAttributes) {
//     xcproject.rootObject.props.attributes.TargetAttributes = {};
//   }
//   xcproject.rootObject.props.attributes.TargetAttributes[stickerTarget.uuid] = {
//     CreatedOnToolsVersion: "12.5",
//     ProvisioningStyle: "Automatic",
//   };

//   console.log(getRealPath(stickersAssetsFile));

//   console.log(build(xcproject.toJSON()));
// });

it("mock", () => {});
