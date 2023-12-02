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
