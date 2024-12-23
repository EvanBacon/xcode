import path from "path";

import { PBXContainerItemProxy, PBXFileReference, XcodeProject } from "..";

const WORKING_FIXTURE = path.join(
  __dirname,
  "../../json/__tests__/fixtures/AFNetworking.pbxproj"
);

it(`adds deterministic UUIDs without collision`, () => {
  const xcproj = XcodeProject.open(WORKING_FIXTURE);

  // @ts-expect-error: Prove that adding a random UUID to the project doesn't change the UUIDs of other objects
  xcproj.set(Math.random().toString(), {});

  const containerItemProxy = PBXContainerItemProxy.create(xcproj, {
    containerPortal: xcproj.rootObject,
    proxyType: 1,
    remoteGlobalIDString: "xxx",
    remoteInfo: "xxx",
  });
  expect(containerItemProxy.uuid).toBe("XX6D16E1EEB44DF363DCC9XX");

  const ref = PBXFileReference.create(xcproj, {
    path: "a.swift",
  });

  expect(ref.uuid).toBe("XXDBE740AD7C410FE2DF44XX");
  expect(
    PBXFileReference.create(xcproj, {
      path: "a.swift",
    }).uuid
  ).toBe("XX5BBE738DD91F7523452AXX");
});

it(`adds framework file with correct defaults for name`, () => {
  const xcproj = XcodeProject.open(WORKING_FIXTURE);

  const ref = PBXFileReference.create(xcproj, {
    path: "System/Library/Frameworks/SwiftUI.framework",
  });

  expect(ref.uuid).toBe("XX4DFF38D47332D6BF0183XX");

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

describe("file defaults", () => {
  const xcproj = XcodeProject.open(WORKING_FIXTURE);
  it(`adds swift file`, () => {
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
  it(`adds css file`, () => {
    const ref = PBXFileReference.create(xcproj, {
      path: "fun/funky.css",
    });

    expect(ref.props).toEqual({
      fileEncoding: 4,
      includeInIndex: 0,
      isa: "PBXFileReference",
      lastKnownFileType: "text.css",
      name: "funky.css",
      path: "fun/funky.css",
      sourceTree: "<group>",
    });
  });
  it(`adds html file`, () => {
    const ref = PBXFileReference.create(xcproj, {
      path: "fun/funky.html",
    });

    expect(ref.props).toEqual({
      fileEncoding: 4,
      includeInIndex: 0,
      isa: "PBXFileReference",
      lastKnownFileType: "text.html",
      name: "funky.html",
      path: "fun/funky.html",
      sourceTree: "<group>",
    });
  });
  it(`adds json file`, () => {
    const ref = PBXFileReference.create(xcproj, {
      path: "fun/funky.json",
    });

    expect(ref.props).toEqual({
      fileEncoding: 4,
      includeInIndex: 0,
      isa: "PBXFileReference",
      lastKnownFileType: "text.json",
      name: "funky.json",
      path: "fun/funky.json",
      sourceTree: "<group>",
    });
  });
  it(`adds random file`, () => {
    const ref = PBXFileReference.create(xcproj, {
      path: "fun/funky",
    });

    expect(ref.props).toEqual({
      fileEncoding: 4,
      includeInIndex: 0,
      isa: "PBXFileReference",
      name: "funky",
      path: "fun/funky",
      sourceTree: "<group>",
    });
  });
  it(`adds js file`, () => {
    const ref = PBXFileReference.create(xcproj, {
      path: "fun/funky.js",
    });

    expect(ref.props).toEqual({
      fileEncoding: 4,
      includeInIndex: 0,
      isa: "PBXFileReference",
      lastKnownFileType: "sourcecode.javascript",
      name: "funky.js",
      path: "fun/funky.js",
      sourceTree: "<group>",
    });
  });
});
