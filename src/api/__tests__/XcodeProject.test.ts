import path from "path";

import { XcodeProject } from "..";

const MALFORMED_FIXTURE = path.join(__dirname, "fixtures/malformed.pbxproj");

const originalConsoleWarn = console.warn;
beforeEach(() => {
  console.warn = jest.fn(originalConsoleWarn);
});
afterAll(() => {
  console.warn = originalConsoleWarn;
});
it(`asserts useful error message when malformed`, () => {
  const project = XcodeProject.open(MALFORMED_FIXTURE);
  expect(console.warn).toHaveBeenCalledWith(
    expect.stringContaining(
      "[Malformed Xcode project]: Found orphaned reference: 13B07F8E1A680F5B00A75B9A > PBXResourcesBuildPhase.files > 3E1C2299F05049539341855D"
    )
  );
});

describe("parse", () => {
  const fixtures = [
    "006-spm.pbxproj",
    "AFNetworking.pbxproj",
    "shopify-tophat.pbxproj",
    // "Cocoa-Application.pbxproj",
    // "project-multitarget-missing-targetattributes.pbxproj",
    // "project-multitarget.pbxproj",
    // "project-rni.pbxproj",
    // "project-swift.pbxproj",
    // "project-with-entitlements.pbxproj",
    // "project-with-incorrect-create-manifest-ios-path.pbxproj",
    // "project-without-create-manifest-ios.pbxproj",
    "project.pbxproj",
    "project-rn74.pbxproj",
    // "swift-protobuf.pbxproj",
    // "watch.pbxproj",
  ];

  fixtures.forEach((fixture) => {
    it(`should parse ${fixture}`, () => {
      const filePath = path.join(
        __dirname,
        "../../json/__tests__/fixtures/",
        fixture
      );
      const project = XcodeProject.open(filePath);
    });
  });
});
