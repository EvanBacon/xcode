import path from "path";

import { XCConfigurationList, XcodeProject } from "..";

const WORKING_FIXTURE = path.join(
  __dirname,
  "../../json/__tests__/fixtures/AFNetworking.pbxproj"
);

it(`gets default configuration`, () => {
  const xcproj = XcodeProject.open(WORKING_FIXTURE);
  const obj = xcproj.getObject(
    "2987B0BA1BC408A200179A4C"
  ) as XCConfigurationList;

  expect(obj.getDefaultConfiguration().uuid).toEqual(
    "2987B0B71BC408A200179A4C"
  );
});
