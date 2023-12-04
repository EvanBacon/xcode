import path from "path";

import { PBXNativeTarget, XcodeProject } from "..";

const WORKING_FIXTURE = path.join(
  __dirname,
  "../../json/__tests__/fixtures/AFNetworking.pbxproj"
);

it(`gets referrers`, () => {
  const xcproj = XcodeProject.open(WORKING_FIXTURE);
  const obj = xcproj.getObject("299522761BBF136400859F49") as PBXNativeTarget;

  expect(obj.getReferrers().map((o) => o.uuid)).toEqual([
    "299522301BBF104D00859F49",
  ]);
});

it(`sets build setting`, () => {
  const xcproj = XcodeProject.open(WORKING_FIXTURE);
  const obj = xcproj.getObject("299522761BBF136400859F49") as PBXNativeTarget;

  // Sanity
  expect(obj.getDefaultBuildSetting("IPHONEOS_DEPLOYMENT_TARGET")).toBe(8);

  expect(obj.setBuildSetting("IPHONEOS_DEPLOYMENT_TARGET", "17.0")).toBe(
    "17.0"
  );

  expect(obj.getDefaultBuildSetting("IPHONEOS_DEPLOYMENT_TARGET")).toBe("17.0");

  obj.removeBuildSetting("IPHONEOS_DEPLOYMENT_TARGET");

  expect(obj.getDefaultBuildSetting("IPHONEOS_DEPLOYMENT_TARGET")).toBe(
    undefined
  );
});
