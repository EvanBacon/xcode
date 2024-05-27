import {
  PBXBuildFile,
  PBXFileReference,
  PBXProject,
  XCConfigurationList,
  XCRemoteSwiftPackageReference,
  XcodeProject,
} from "./types";

/** Create a list of <UUID, Comment> */
export function createReferenceList(
  project: Partial<XcodeProject>
): Record<string, string> {
  const strict = false;
  const objects: Record<string, any> = project?.objects ?? {};

  const referenceCache: Record<string, string> = {};

  function getXCConfigurationListComment(id: string) {
    for (const [innerId, obj] of Object.entries(objects) as any) {
      if (obj.buildConfigurationList === id) {
        let name = obj.name ?? obj.path ?? obj.productName;
        if (!name) {
          name =
            objects[obj.targets?.[0]]?.productName ??
            objects[obj.targets?.[0]]?.name;

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
      buildFile.fileRef ?? buildFile.productRef,
      objects[buildFile.fileRef ?? buildFile.productRef]
    );

    return `${name} in ${buildPhaseName}`;
  }

  function getCommentForObject(
    id: string,
    object: Record<string, any>
  ): string | null {
    if (!object?.isa) {
      return null;
    }
    if (id in referenceCache) {
      return referenceCache[id];
    }
    if (isPBXBuildFile(object)) {
      referenceCache[id] = getPBXBuildFileComment(id, object);
    } else if (isXCConfigurationList(object)) {
      referenceCache[id] = getXCConfigurationListComment(id);
    } else if (isXCRemoteSwiftPackageReference(object)) {
      if (object.repositoryURL) {
        referenceCache[id] = `${object.isa} "${getRepoNameFromURL(
          object.repositoryURL
        )}"`;
      } else {
        referenceCache[id] = object.isa;
      }
    } else if (isPBXProject(object)) {
      referenceCache[id] = "Project object";
    } else if (object.isa?.endsWith("BuildPhase")) {
      referenceCache[id] = getBuildPhaseName(object) ?? "";
    } else {
      if (
        object.isa === "PBXGroup" &&
        object.name === undefined &&
        object.path === undefined
      ) {
        referenceCache[id] = "";
      } else {
        referenceCache[id] =
          object.name ??
          object.productName ??
          object.path ??
          object.isa ??
          null;
      }
    }
    return referenceCache[id] ?? null;
  }

  Object.entries(objects).forEach(([id, object]) => {
    if (!getCommentForObject(id, object)) {
      if (strict)
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

function getRepoNameFromURL(repoUrl: string) {
  try {
    const url = new URL(repoUrl);
    // github.com/expo/spm-package -> spm-package
    if (url.hostname === "github.com") {
      return url.pathname.split("/").pop();
    }
  } catch {}
  return repoUrl;
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

function isXCRemoteSwiftPackageReference(
  val: any
): val is XCRemoteSwiftPackageReference {
  return val?.isa === "XCRemoteSwiftPackageReference";
}

function isXCConfigurationList(val: any): val is XCConfigurationList {
  return val?.isa === "XCConfigurationList";
}

function getBuildPhaseName(buildPhase: any) {
  return buildPhase.name ?? getDefaultBuildPhaseName(buildPhase.isa);
}

/** Return the default name for a build phase object based on the `isa` */
function getDefaultBuildPhaseName(isa: string): string | null {
  return isa.match(/PBX([a-zA-Z]+)BuildPhase/)?.[1] ?? null;
}
