import path from "path";

import {
  FILE_TYPES_BY_EXTENSION,
  SOURCETREE_BY_FILETYPE,
} from "./utils/constants";
import * as json from "../json/types";
import { PBXGroup } from "./AbstractGroup";
import { PBXBuildFile } from "./PBXBuildFile";
import { AbstractObject } from "./AbstractObject";
import {
  getFullPath,
  getParent,
  getParents,
  getRealPath,
  getSourceTreeRealPath,
} from "./utils/paths";
import type { PickRequired, SansIsa } from "./utils/util.types";
import type { XcodeProject } from "./XcodeProject";
import { PBXContainerItemProxy } from "./PBXContainerItemProxy";
import { PBXReferenceProxy } from "./PBXReferenceProxy";
import { PBXTargetDependency } from "./PBXTargetDependency";

const debug = require("debug")("xcparse:models") as typeof console.log;

function getPossibleDefaultSourceTree(
  fileReference: Pick<
    PBXFileReferenceModel,
    "lastKnownFileType" | "explicitFileType"
  >
): json.SourceTree {
  const possibleSourceTree = fileReference.lastKnownFileType
    ? SOURCETREE_BY_FILETYPE[fileReference.lastKnownFileType]
    : undefined;

  if (fileReference.explicitFileType) {
    return "BUILT_PRODUCTS_DIR";
  }

  return possibleSourceTree ?? "<group>";
}

/**
 * Sets the path of the given object according to the provided source
 * tree key. The path is converted to relative according to the real
 * path of the source tree for group and project source trees, if both
 * paths are relative or absolute. Otherwise the path is set as
 * provided.
 *
 * @param object The object whose path needs to be set.
 */
function setPathWithSourceTree(
  object: PBXGroup | PBXFileReference,
  _path: string,
  sourceTree: json.SourceTree
) {
  let nPath = path.resolve(_path);
  object.props.sourceTree = sourceTree;

  if (sourceTree === "<absolute>") {
    if (!path.isAbsolute(nPath)) {
      throw new Error(
        "[Xcodeproj] Attempt to set a relative path with an " +
          `absolute source tree: ${_path}`
      );
    }
    object.props.path = nPath;
  } else if (sourceTree == "<group>" || sourceTree == "SOURCE_ROOT") {
    const sourceTreeRealPath = getSourceTreeRealPath(object);

    if (sourceTreeRealPath && path.resolve(sourceTreeRealPath) === nPath) {
      let relativePath = path.relative(sourceTreeRealPath, nPath);
      object.props.path = relativePath;
    } else {
      object.props.path = nPath;
    }
  } else {
    object.props.path = nPath;
  }
}

export type PBXFileReferenceModel = json.PBXFileReference;

export class PBXFileReference extends AbstractObject<PBXFileReferenceModel> {
  static isa = json.ISA.PBXFileReference as const;
  static is(object: any): object is PBXFileReference {
    return object.isa === PBXFileReference.isa;
  }
  static create(
    project: XcodeProject,
    opts: PickRequired<SansIsa<PBXFileReferenceModel>, "path">
  ) {
    // @ts-expect-error
    return project.createModel<PBXFileReferenceModel>({
      isa: PBXFileReference.isa,
      ...opts,
    }) as PBXFileReference;
  }

  protected getObjectProps() {
    return {};
  }

  protected setupDefaults() {
    if (this.props.fileEncoding == null) {
      this.props.fileEncoding = 4;
    }
    // if (this.sourceTree == null) {
    //   this.sourceTree = "SOURCE_ROOT";
    // }

    if (!this.props.explicitFileType && !this.props.lastKnownFileType) {
      this.setExplicitFileType();
    }

    if (this.props.includeInIndex == null) {
      this.props.includeInIndex = 0;
    }
    if (this.props.name == null && this.props.path) {
      this.props.name = path.basename(this.props.path);
    }
    if (!this.props.sourceTree) {
      this.props.sourceTree = getPossibleDefaultSourceTree(this.props);
    }
  }
  getParent() {
    return getParent(this);
  }

  getParents() {
    return getParents(this);
  }

  move(parent: PBXGroup) {
    PBXGroup.move(this, parent);
  }

  getRealPath(): string {
    return getRealPath(this);
  }

  getFullPath(): string {
    return getFullPath(this);
  }

  setLastKnownFileType(type?: json.FileType) {
    if (type) {
      this.props.lastKnownFileType = type;
    } else if (this.props.path) {
      let extension = path.extname(this.props.path);
      if (extension.startsWith(".")) {
        extension = extension.substring(1);
      }
      this.props.lastKnownFileType = FILE_TYPES_BY_EXTENSION[extension];
      debug(
        `setLastKnownFileType (ext: ${extension}, type: ${this.props.lastKnownFileType})`
      );
    }
  }

  setExplicitFileType(type?: json.FileType) {
    if (type) {
      this.props.explicitFileType = type;
    } else if (this.props.path) {
      const extension = path.extname(this.props.path);
      this.props.explicitFileType = FILE_TYPES_BY_EXTENSION[extension];
    }

    if (this.props.explicitFileType) {
      // clear this out like Xcode
      this.props.lastKnownFileType = undefined;
    }
  }

  getDisplayName() {
    if (this.props.name) {
      return this.props.name;
    } else if (
      this.props.path &&
      this.props.sourceTree === "BUILT_PRODUCTS_DIR"
    ) {
      return this.props.path;
    } else if (this.props.path) {
      return path.basename(this.props.path);
    }
    // Probably never happens
    return this.isa.replace(/^(PBX|XC)/, "");
  }

  getProxyContainers(): PBXContainerItemProxy[] {
    return Array.from(this.getXcodeProject().values()).filter(
      (object) =>
        PBXContainerItemProxy.is(object) &&
        object.props.containerPortal.uuid === this.uuid
    ) as PBXContainerItemProxy[];
  }

  // Set the path according to the source tree of the reference.
  setPath(path?: string) {
    if (path) {
      setPathWithSourceTree(this, path, this.props.sourceTree);
    } else {
      this.props.path = undefined;
    }
  }

  getBuildFiles() {
    return this.getReferrers().filter((ref) => PBXBuildFile.is(ref));
  }

  /**
   * If this file reference represents an external Xcode project reference
   * then this will return dependencies on targets contained in the
   * external Xcode project.
   *
   * @return [Array<PBXTargetDependency>] The dependencies on targets
   *         located in the external Xcode project.
   */
  getTargetDependencyProxies(): PBXTargetDependency[] {
    const containers = this.getProxyContainers();
    if (!containers.length) {
      return [];
    }

    return Array.from(this.getXcodeProject().values()).filter((object) => {
      return (
        PBXTargetDependency.is(object) &&
        containers.some(
          (container) => container.uuid === object.props.targetProxy.uuid
        )
      );
    }) as PBXTargetDependency[];
  }

  removeFromProject() {
    this.getFileReferenceProxies().forEach((proxy) => {
      proxy.removeFromProject();
    });
    this.getTargetDependencyProxies().forEach((proxy) => {
      proxy.removeFromProject();
    });
    this.getBuildFiles().forEach((file) => file.removeFromProject());
    return super.removeFromProject();
  }

  getFileReferenceProxies(): PBXReferenceProxy[] {
    const containers = this.getProxyContainers();
    if (!containers.length) {
      return [];
    }

    return [...this.getXcodeProject().values()].filter((object) => {
      if (!PBXReferenceProxy.is(object)) {
        return false;
      }

      return !!containers.find(
        (container) =>
          PBXContainerItemProxy.is(object.props.remoteRef) &&
          container.uuid === object.props.remoteRef.uuid
      );
    }) as PBXReferenceProxy[];
  }
}
