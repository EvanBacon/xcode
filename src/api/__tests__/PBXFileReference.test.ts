import path from "path";

import { PBXFileReference, XcodeProject } from "..";

const WORKING_FIXTURE = path.join(
  __dirname,
  "../../json/__tests__/fixtures/AFNetworking.pbxproj"
);

it(`adds framework file with correct defaults for name`, () => {
  const xcproj = XcodeProject.open(WORKING_FIXTURE);

  const ref = PBXFileReference.create(xcproj, {
    path: "System/Library/Frameworks/SwiftUI.framework",
  });

  expect(ref.props).toEqual({
    fileEncoding: 4,
    includeInIndex: undefined,
    isa: "PBXFileReference",
    name: "SwiftUI.framework",
    path: "System/Library/Frameworks/SwiftUI.framework",
    lastKnownFileType: "wrapper.framework",
    sourceTree: "SDKROOT",
  });
});

it(`adds swift file`, () => {
  const xcproj = XcodeProject.open(WORKING_FIXTURE);

  const ref = PBXFileReference.create(xcproj, {
    path: "fun/funky.swift",
  });

  expect(ref.props).toEqual({
    fileEncoding: 4,
    includeInIndex: 0,
    isa: "PBXFileReference",
    lastKnownFileType: "sourcecode.swift",
    name: "funky.swift",
    path: "fun/funky.swift",
    sourceTree: "<group>",
  });
});
