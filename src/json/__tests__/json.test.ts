import { parse, build } from "..";
import path from "path";
import fs from "fs";
import { inspect } from "util";

import { getPbxprojAsJsonWithPlutil, deepCompare } from "./compare-utils";

describe(parse, () => {
  const fixtures = [
    "006-spm.pbxproj",
    // "AFNetworking.pbxproj",
    // "project.pbxproj",
    // "project-rn74.pbxproj",

    // "Cocoa-Application.pbxproj",
    // "project-multitarget-missing-targetattributes.pbxproj",
    // "project-multitarget.pbxproj",
    // "project-rni.pbxproj",
    // "project-swift.pbxproj",
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
        console.log("json", json);

        const result = parse(file);

        console.log(result.objects!["00DD1BFF1BD5951E006B06BC"]);
        expect(json).toEqual(result);
        // deepCompare(json, result);
        // const file = fs.readFileSync(filePath, "utf8");
        // const result = parse(file);
        // expect(result).toBeTruthy();
        // console.log(inspect(result, { depth: 5, colors: true }));
        // console.log(build(result));
      });

      it(`should parse ${fixture}`, () => {
        const result = parse(file);
        expect(result).toBeTruthy();
        // console.log(inspect(result, { depth: 5, colors: true }));
        // console.log(build(result));
      });

      it(`should write the same pbxproj ${fixture}`, () => {
        const result = parse(file);
        expect(result).toBeTruthy();
        const output = build(result);
        expect(output).toEqual(file);
      });
    });
  });
});
