import { parse, build } from "..";
import path from "path";
import fs from "fs";
import { inspect } from "util";

describe(parse, () => {
  const fixtures = [
    // "AFNetworking.pbxproj",
    // "Cocoa-Application.pbxproj",
    // "project-multitarget-missing-targetattributes.pbxproj",
    // "project-multitarget.pbxproj",
    // "project-rni.pbxproj",
    // "project-swift.pbxproj",
    // "project-with-entitlements.pbxproj",
    // "project-with-incorrect-create-manifest-ios-path.pbxproj",
    // "project-without-create-manifest-ios.pbxproj",
    "project.pbxproj",
    // "swift-protobuf.pbxproj",
    // "watch.pbxproj",
  ];

  fixtures.forEach((fixture) => {
    it(`should parse ${fixture}`, () => {
      const filePath = path.join(__dirname, "./fixtures/", fixture);
      const file = fs.readFileSync(filePath, "utf8");
      const result = parse(file);
      expect(result).toBeTruthy();
      console.log(inspect(result, { depth: 5, colors: true }));
      console.log(build(result));
    });
  });
});
