import { PBXFileReference, XcodeProject } from "../..";
import { getFullPath, getRealPath, getSourceTreeRealPath } from "../paths";
import AFNetworkingFixture from "../../../json/__tests__/fixtures/AFNetworking";

describe(getFullPath, () => {
  const xcodeProject = new XcodeProject(
    "/foo/bar/AFNetworking.xcodeproj/project.pbxproj",
    AFNetworkingFixture
  );
  it(`should return the full path`, () => {
    const obj = xcodeProject.get(
      "299522521BBF125A00859F49"
    ) as PBXFileReference;

    expect(getFullPath(obj)).toBe("AFNetworking/AFURLSessionManager.m");
    expect(getSourceTreeRealPath(obj)).toBe("/foo/bar/AFNetworking");
    expect(getRealPath(obj)).toBe(
      "/foo/bar/AFNetworking/AFURLSessionManager.m"
    );
  });
  it(`should return the path for a group`, () => {
    const group = xcodeProject.rootObject.props.mainGroup.mkdir(
      "evan/bacon/world",
      { recursive: true }
    );
    expect(getFullPath(group!)).toBe("evan/bacon/world");
    expect(getRealPath(group!)).toBe("/foo/bar/evan/bacon/world");
  });
});
