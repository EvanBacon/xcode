import {
  PBXBuildFile,
  PBXFileReference,
  PBXProject,
  XCConfigurationList,
  XcodeProject,
} from "./types";

/** Create a list of <UUID, Comment> */
export function createReferenceList(
  project: Partial<XcodeProject>
): Record<string, string> {
  const objects: Record<string, any> = project?.objects ?? {};

  const referenceCache: Record<string, string> = {};

  function getXCConfigurationListComment(id: string) {
    for (const [innerId, obj] of Object.entries(objects) as any) {
      if (obj.buildConfigurationList === id) {
        let name = obj.name ?? obj.path ?? obj.productName;
        if (!name) {
          // NOTE(EvanBacon): I have no idea what I'm doing...
          // this is for the case where the build configuration list is pointing to the main `PBXProject` object (no name).
          // We locate the proxy (which may or may not be related) and use the remoteInfo property.
          const proxy = Object.values(objects).find(
            (obj: any) =>
              obj.isa === "PBXContainerItemProxy" &&
              obj.containerPortal === innerId
          );
          name = proxy?.remoteInfo;
        }

        return `Build configuration list for ${obj.isa} "${name}"`;
      }
    }
    return `Build configuration list for [unknown]`;
  }

  function getBuildPhaseNameContainingFile(buildFileId: string): string | null {
    const buildPhase = Object.values(objects).find((obj: any) =>
      obj.files?.includes(buildFileId)
    );

    return buildPhase ? getBuildPhaseName(buildPhase) : null;
  }

  function getPBXBuildFileComment(id: string, buildFile: PBXBuildFile) {
    const buildPhaseName =
      getBuildPhaseNameContainingFile(id) ?? "[missing build phase]";

    const name = getCommentForObject(
      buildFile.fileRef,
      objects[buildFile.fileRef]
    );

    return `${name} in ${buildPhaseName}`;
  }

  function getCommentForObject(
    id: string,
    object: Record<string, any>
  ): string | null {
    if (id in referenceCache) {
      return referenceCache[id];
    }
    if (isPBXBuildFile(object)) {
      referenceCache[id] = getPBXBuildFileComment(id, object);
    } else if (isXCConfigurationList(object)) {
      referenceCache[id] = getXCConfigurationListComment(id);
    } else if (isPBXProject(object)) {
      referenceCache[id] = "Project object";
    } else if (object.isa.endsWith("BuildPhase")) {
      referenceCache[id] = getBuildPhaseName(object) ?? "";
    } else {
      referenceCache[id] = object.name ?? object.path ?? object.isa ?? null;
    }
    return referenceCache[id] ?? null;
  }

  Object.entries(objects).forEach(([id, object]) => {
    if (!getCommentForObject(id, object)) {
      throw new Error(
        "Failed to find comment reference for ID: " +
          id +
          ", isa: " +
          object.isa
      );
    }
  });

  return referenceCache;
}

function isPBXProject(val: any): val is PBXProject {
  return val?.isa === "PBXProject";
}

export function isPBXBuildFile(val: any): val is PBXBuildFile {
  return val?.isa === "PBXBuildFile";
}
export function isPBXFileReference(val: any): val is PBXFileReference {
  return val?.isa === "PBXFileReference";
}

function isXCConfigurationList(val: any): val is XCConfigurationList {
  return val?.isa === "XCConfigurationList";
}

function getBuildPhaseName(buildPhase: any) {
  return buildPhase.name ?? getDefaultBuildPhaseName(buildPhase.isa);
}

function getDefaultBuildPhaseName(isa: string): string | null {
  return (
    {
      PBXSourcesBuildPhase: "Sources",
      PBXFrameworksBuildPhase: "Frameworks",
      PBXResourcesBuildPhase: "Resources",
    }[isa] ?? null
  );
}
