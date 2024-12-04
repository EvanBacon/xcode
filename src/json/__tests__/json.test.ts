import { parse, build } from "..";
import path from "path";
import fs from "fs";
import { inspect } from "util";

import {
  getPbxprojAsJsonWithPlutil,
  deepCompare,
  deepCoerceToString,
} from "./compare-utils";

describe(parse, () => {
  const fixtures = [
    "01-float.pbxproj",
    "006-spm.pbxproj",
    "007-xcode16.pbxproj",
    "shopify-tophat.pbxproj",
    "AFNetworking.pbxproj",
    "project.pbxproj",
    "project-rn74.pbxproj",

    "Cocoa-Application.pbxproj",
    "project-multitarget-missing-targetattributes.pbxproj",
    "project-multitarget.pbxproj",
    "project-rni.pbxproj",
    "project-swift.pbxproj",
    // "project-with-entitlements.pbxproj",

    // "project-with-incorrect-create-manifest-ios-path.pbxproj",
    // "project-without-create-manifest-ios.pbxproj",
    // "swift-protobuf.pbxproj",
    // "watch.pbxproj",
  ];

  fixtures.forEach((fixture) => {
    const filePath = path.join(__dirname, "./fixtures/", fixture);
    const file = fs.readFileSync(filePath, "utf8");

    describe(fixture, () => {
      it(`should match plutil: ${fixture}`, async () => {
        const json = await getPbxprojAsJsonWithPlutil(filePath);
        // plutil opts to make everything a string, this is a workaround to get closer comparison
        const result = deepCoerceToString(parse(file));
        expect(result).toEqual(json);
      });
    });
  });

  const inOutFixtures = [
    "006-spm.pbxproj",
    "007-xcode16.pbxproj",
    "AFNetworking.pbxproj",
    "project.pbxproj",
    "project-rn74.pbxproj",
    "project-multitarget-missing-targetattributes.pbxproj",
    "project-multitarget.pbxproj",
    "project-rni.pbxproj",
    "project-swift.pbxproj",

    "project-with-entitlements.pbxproj",

    "project-with-incorrect-create-manifest-ios-path.pbxproj",
    "project-without-create-manifest-ios.pbxproj",
    "watch.pbxproj",
    // "swift-protobuf.pbxproj",
  ];

  inOutFixtures.forEach((fixture) => {
    const filePath = path.join(__dirname, "./fixtures/", fixture);
    const file = fs.readFileSync(filePath, "utf8");

    describe(fixture, () => {
      it(`should write the same pbxproj ${fixture}`, () => {
        const result = parse(file);
        expect(result).toBeTruthy();
        const output = build(result);
        expect(output).toEqual(file);
      });
    });
  });
});
