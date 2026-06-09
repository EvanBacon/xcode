import {
  PBXBuildFile,
  PBXFileReference,
  PBXProject,
  XCConfigurationList,
  XCRemoteSwiftPackageReference,
  XCLocalSwiftPackageReference,
  XcodeProject,
} from "./types";

/** Create a list of <UUID, Comment> */
export function createReferenceList(
  project: Partial<XcodeProject>
): Record<string, string> {
  const strict = false;
  const objects: Record<string, any> = project?.objects ?? {};

  // Xcode 27.0 writes pbxproj files with `objectVersion = 90`, which introduced
  // a more descriptive comment style for build configurations, e.g.
  // `Debug configuration for PBXNativeTarget "App"` instead of just `Debug`.
  const usesVerboseConfigComments = Number(project?.objectVersion) >= 90;

  const referenceCache: Record<string, string> = {};

  /**
   * Resolve the object that owns a given `XCConfigurationList` (the target or
   * project whose `buildConfigurationList` points at it) and return its `isa`
   * and display name, matching the values Xcode embeds in pbxproj comments.
   */
  function getConfigurationListOwner(
    id: string
  ): { isa: string; name: string } | null {
    for (const [innerId, obj] of Object.entries(objects) as any) {
      if (obj.buildConfigurationList === id) {
        let name = obj.name ?? obj.path ?? obj.productName;
        if (!name) {
          // The main `PBXProject` object has no name; Xcode labels it with the
          // project name, which the built product is named after. Derive it from
          // the first target's product reference (e.g. `App.app` -> `App`),
          // falling back to the target's name/productName.
          const firstTarget = objects[obj.targets?.[0]];
          const productPath =
            objects[firstTarget?.productReference]?.path ??
            objects[firstTarget?.productReference]?.name;
          name =
            (productPath && productPath.replace(/\.[^.]+$/, "")) ??
            firstTarget?.productName ??
            firstTarget?.name;

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

        return { isa: obj.isa, name };
      }
    }
    return null;
  }

  function getXCConfigurationListComment(id: string) {
    const owner = getConfigurationListOwner(id);
    if (!owner) {
      return `Build configuration list for [unknown]`;
    }
    return `Build configuration list for ${owner.isa} "${owner.name}"`;
  }

  function getXCBuildConfigurationComment(id: string, object: any): string {
    // Older pbxproj versions just use the configuration name (e.g. `Debug`).
    if (!usesVerboseConfigComments) {
      return object.name ?? "";
    }
    // Find the configuration list that contains this build configuration, then
    // describe it in terms of its owning target/project.
    for (const [listId, obj] of Object.entries(objects) as any) {
      if (obj.isa === "XCConfigurationList" && obj.buildConfigurations?.includes(id)) {
        const owner = getConfigurationListOwner(listId);
        if (owner) {
          return `${object.name} configuration for ${owner.isa} "${owner.name}"`;
        }
        break;
      }
    }
    return object.name ?? "";
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

    const refId = buildFile.fileRef ?? buildFile.productRef;
    if (!refId) {
      return `[unknown] in ${buildPhaseName}`;
    }

    const name = getCommentForObject(refId, objects[refId]);

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
    } else if (object.isa === "XCBuildConfiguration") {
      referenceCache[id] = getXCBuildConfigurationComment(id, object);
    } else if (isXCRemoteSwiftPackageReference(object)) {
      if (object.repositoryURL) {
        referenceCache[id] = `${object.isa} "${getRepoNameFromURL(
          object.repositoryURL
        )}"`;
      } else {
        referenceCache[id] = object.isa;
      }
    } else if (isXCLocalSwiftPackageReference(object)) {
      if (object.relativePath) {
        referenceCache[id] = `${object.isa} "${object.relativePath}"`;
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
function isXCLocalSwiftPackageReference(
  val: any
): val is XCLocalSwiftPackageReference {
  return val?.isa === "XCLocalSwiftPackageReference";
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
