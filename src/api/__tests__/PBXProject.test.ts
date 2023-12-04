import path from "path";

import { XcodeProject } from "..";

const WORKING_FIXTURE = path.join(
  __dirname,
  "../../json/__tests__/fixtures/project-multitarget.pbxproj"
);

it(`gets main app target`, () => {
  const xcproj = XcodeProject.open(WORKING_FIXTURE);
  const obj = xcproj.rootObject.getMainAppTarget();
  expect(obj?.uuid).toEqual("13B07F861A680F5B00A75B9A");
});
