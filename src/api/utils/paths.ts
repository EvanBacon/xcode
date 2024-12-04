// https://github.com/CocoaPods/Xcodeproj/blob/14c3954d05ca954ee7b43498def8077cc7495509/lib/xcodeproj/project/object/helpers/groupable_helper.rb#L100
import assert from "assert";
import path from "path";

import * as json from "../../json/types";
import type {
  PBXGroup,
  PBXFileReference,
  AbstractObject,
  PBXProject,
  PBXFileSystemSynchronizedBuildFileExceptionSet,
  PBXFileSystemSynchronizedGroupBuildPhaseMembershipExceptionSet,
  PBXNativeTarget,
} from "../";

function unique<T>(array: T[]) {
  return Array.from(new Set(array));
}

function isPBXProject(value: any): value is PBXProject {
  return value.isa === "PBXProject";
}
function isPBXGroup(value: any): value is PBXGroup {
  return value.isa === "PBXGroup";
}

function getReferringGroups(
  object:
    | PBXGroup
    | PBXFileReference
    | PBXProject
    | PBXFileSystemSynchronizedBuildFileExceptionSet
    | PBXFileSystemSynchronizedGroupBuildPhaseMembershipExceptionSet
): (PBXGroup | PBXProject)[] {
  let referrers = unique(object.getReferrers());
  if (referrers.length > 1) {
    return referrers.filter((referrer: any) =>
      isPBXGroup(referrer)
    ) as PBXGroup[];
  } else if (referrers.length === 1) {
    const reference = referrers[0];
    assert(
      isPBXProject(reference) || isPBXGroup(reference),
      "referring object is not a PBXGroup or PBXProject"
    );
    return [reference];
  }
  return [];
}

export function getParent(
  object:
    | PBXGroup
    | PBXFileReference
    | PBXProject
    | PBXFileSystemSynchronizedBuildFileExceptionSet
    | PBXFileSystemSynchronizedGroupBuildPhaseMembershipExceptionSet
): PBXGroup | PBXProject {
  const referrers = getReferringGroups(object);

  if (!referrers.length) {
    throw new Error(
      `Consistency issue: no parent for object: "${
        object.getDisplayName() || object.isa + " - " + object.uuid
      }"`
    );
  } else if (referrers.length > 1) {
    throw new Error(
      `Consistency issue: multiple parents for object: "${object.getDisplayName()}": ${referrers
        .map((referrer) => referrer.getDisplayName())
        .join(", ")}`
    );
  }
  return referrers[0];
}

export function getParents(
  object: PBXGroup | PBXFileReference | PBXProject
): (PBXGroup | PBXProject)[] {
  if (isMainGroup(object)) {
    return [];
  }

  const parent = getParent(object);
  return [...getParents(parent), parent];
}

function isMainGroup(object: AbstractObject): boolean {
  return (
    object.uuid === object.getXcodeProject().rootObject.props.mainGroup.uuid
  );
}

export function getRealPath(object: PBXGroup | PBXFileReference): string {
  let sourceTree = getSourceTreeRealPath(object);
  let _path = object.props.path || "";
  if (sourceTree) {
    return path.join(sourceTree, _path);
  }
  return _path;
}

export function getSourceTreeRealPath(
  object: PBXGroup | PBXFileReference
): string {
  if (object.props.sourceTree === "<group>") {
    const objectParent = getParent(object);
    if (isPBXProject(objectParent)) {
      return path.join(
        object.getXcodeProject().getProjectRoot(),
        object.project.props.projectDirPath
      );
    }
    return getRealPath(objectParent);
  } else if (object.props.sourceTree === "SOURCE_ROOT") {
    return path.resolve(object.getXcodeProject().getProjectRoot());
  } else if (object.props.sourceTree === "<absolute>") {
    return "";
  }
  return object.props.sourceTree;
}

function getResolvedRootPath(object: PBXGroup | PBXFileReference): string {
  if (object.props.sourceTree === "<group>") {
    const objectParent = getParent(object);
    if (isPBXProject(objectParent)) {
      return "";
    }
    return getFullPath(objectParent);
  } else if (object.props.sourceTree === "SOURCE_ROOT") {
    return "";
  } else if (object.props.sourceTree === "<absolute>") {
    return "/";
  }
  return object.props.sourceTree;
}

export function getFullPath(object: PBXGroup | PBXFileReference): string {
  const rootPath = getResolvedRootPath(object);

  if (object.props.path) {
    return path.join(rootPath, object.props.path);
  }
  return rootPath;
}

export function getReferringTargets(object: AbstractObject): PBXNativeTarget[] {
  return object.getReferrers().filter((ref) => {
    return isPBXNativeTarget(ref);
  }) as PBXNativeTarget[];
}

function isPBXNativeTarget(object: any): object is PBXNativeTarget {
  return object.isa === json.ISA.PBXNativeTarget;
}
