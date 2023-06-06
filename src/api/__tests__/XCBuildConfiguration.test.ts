import path from "path";

import { PBXFileReference, XCBuildConfiguration, XcodeProject } from "..";

const MALFORMED_FIXTURE = path.join(__dirname, "fixtures/malformed.pbxproj");

it(`creates with models`, () => {
  const xcproj = XcodeProject.open(MALFORMED_FIXTURE);

  XCBuildConfiguration.create(xcproj, {
    name: "Debug",
    buildSettings: {
      INFOPLIST_FILE: "Info.plist",
      PRODUCT_BUNDLE_IDENTIFIER: "com.example.app",
      IPHONEOS_DEPLOYMENT_TARGET: "14.0",
    },
    baseConfigurationReference: PBXFileReference.create(xcproj, {
      path: "Debug.xcconfig",
    }),
  });
});
