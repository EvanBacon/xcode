import { parse, write } from "../index";
import path from "path";
import fs from "fs";

describe(parse, () => {
  const fixtures = [
    // path.join(__dirname, "fixtures/project.pbxproj"),
    // path.join(__dirname, "fixtures/swift-protobuf.pbxproj"),
    // path.join(__dirname, "fixtures/watch.pbxproj"),
    path.join(
      __dirname,
      "fixtures/project-with-incorrect-create-manifest-ios-path.pbxproj"
    ),
    // path.join(__dirname, "fixtures/Cocoa-Application.pbxproj"),
    // path.join(__dirname, "fixtures/project-multitarget.pbxproj"),
    // path.join(
    //   __dirname,
    //   "fixtures/project-multitarget-missing-targetattributes.pbxproj"
    // ),
  ];

  for (const fixture of fixtures) {
    it(`should parse ${fixture}`, () => {
      const text = fs.readFileSync(fixture, "utf8");
      const project = parse(text);
      //   expect(project).toMatchSnapshot();
      expect(write(project)).toEqual(text);
    });
  }
});
