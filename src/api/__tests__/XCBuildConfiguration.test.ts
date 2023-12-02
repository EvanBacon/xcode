import path from "path";
import * as json from "../../json/types";

import { PBXFileReference, XCBuildConfiguration, XcodeProject } from "..";

const WORKING_FIXTURE = path.join(
  __dirname,
  "../../json/__tests__/fixtures/AFNetworking.pbxproj"
);
const MALFORMED_FIXTURE = path.join(__dirname, "fixtures/malformed.pbxproj");

const originalWarn = console.warn;

afterEach(() => {
  console.warn = originalWarn;
});

it(`creates with models`, () => {
  console.warn = jest.fn();
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
  expect(console.warn).toBeCalledTimes(1);
  expect(console.warn).toHaveBeenNthCalledWith(
    1,
    "[Malformed Xcode project]: Found orphaned reference: 13B07F8E1A680F5B00A75B9A > PBXResourcesBuildPhase.files > 3E1C2299F05049539341855D"
  );
});

describe(`resolve settings`, () => {
  function getFixture(buildSettings: Partial<json.BuildSettings> = {}) {
    const xcproj = XcodeProject.open(WORKING_FIXTURE);

    return XCBuildConfiguration.create(xcproj, {
      name: "Debug",
      buildSettings: {
        INFOPLIST_FILE: "Info.plist",
        PRODUCT_BUNDLE_IDENTIFIER: "com.example.app",
        IPHONEOS_DEPLOYMENT_TARGET: "14.0",
        ...buildSettings,
      },
      baseConfigurationReference: PBXFileReference.create(xcproj, {
        path: "Debug.xcconfig",
      }),
    });
  }

  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  it(`resolves build settings`, () => {
    process.env.WUT_BACON = "evan";
    process.env.CUSTOM_ENV_SETTING = "bacon";
    const config = getFixture({
      INSTALL_PATH: "$(LOCAL_LIBRARY_DIR)/Frameworks",
      ASSETCATALOG_COMPILER_APPICON_NAME:
        "$(WUT_$(CUSTOM_ENV_SETTING:upper))/hello",
    });

    expect(config.resolveBuildSetting("INSTALL_PATH")).toBe(
      "/Library/Frameworks"
    );

    expect(
      config.resolveBuildSetting("ASSETCATALOG_COMPILER_APPICON_NAME")
    ).toBe("evan/hello");
  });
});
