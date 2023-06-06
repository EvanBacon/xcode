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
