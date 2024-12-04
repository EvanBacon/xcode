import assert from "assert";
import path from "path";

import { PRODUCT_UTI_EXTENSIONS } from "./utils/constants";
import * as json from "../json/types";
import { getParent, getParents } from "./utils/paths";
import { AbstractObject } from "./AbstractObject";
import { PBXFileReference, PBXFileReferenceModel } from "./PBXFileReference";

import type { PickRequired, SansIsa } from "./utils/util.types";
import type { XcodeProject } from "./XcodeProject";
import type { PBXProject } from "./PBXProject";
import type { PBXReferenceProxy } from "./PBXReferenceProxy";
import type { PBXFileSystemSynchronizedRootGroup } from "./PBXFileSystemSynchronizedRootGroup";
// const debug = require("debug")("xcparse:models") as typeof console.log;

export class AbstractGroup<
  TJSON extends json.PBXGroup<
    any,
    PBXGroup | PBXReferenceProxy | PBXFileReference | PBXFileSystemSynchronizedRootGroup
  >
> extends AbstractObject<TJSON> {
  // This doesn't have to be any, but otherwise the type is unacceptably long.
  protected getObjectProps(): any {
    return {
      children: Array,
    };
  }

  protected setupDefaults() {
    if (!this.props.children) {
      this.props.children = [];
    }
  }

  createGroup(opts: SansIsa<Partial<TJSON>>) {
    assert(opts.path || opts.name, "A group must have a path or name");
    const group: PBXGroup = PBXGroup.create(this.getXcodeProject(), {
      ...opts,
    });
    this.props.children.push(group);
    return group;
  }

  /**
   * Traverses the children groups and finds the children with the given
   * path, optionally, creating any needed group. If the given path is
   * `null` it returns itself.
   *
   * @param path a string with the names of the groups separated by a `/`.
   * @param shouldCreate whether the path should be created.
   *
   * @return `PBXGroup` the group if found.
   * @return `null` if the `path` could not be found and `shouldCreate` is `false`.
   */
  mkdir(
    path: string | string[],
    { recursive }: { recursive?: boolean } = {}
  ): PBXGroup | null {
    let pathArr: string[] = typeof path === "string" ? path.split("/") : path;
    if (!pathArr.length) {
      return this;
    }

    let childName = pathArr.shift();
    let child = this.getChildGroups().find(
      (c) => c.getDisplayName() === childName
    );

    if (!child) {
      if (!recursive) {
        return null;
      }
      // @ts-expect-error: IDK
      child = this.createGroup({
        path: childName!,
      });
    }

    if (!path.length) {
      return child;
    }
    return child.mkdir(pathArr, { recursive });
  }

  getChildGroups(): PBXGroup[] {
    return this.props.children.filter((child) =>
      PBXGroup.is(child)
    ) as PBXGroup[];
  }

  createNewProductRefForTarget(
    productBaseName: string,
    type: keyof typeof PRODUCT_UTI_EXTENSIONS
  ) {
    let prefix = "";
    if (type == "staticLibrary") {
      prefix = "lib";
    }

    let extension = PRODUCT_UTI_EXTENSIONS[type];
    let path = `${prefix}${productBaseName}`;
    if (extension) {
      path += `.${extension}`;
    }
    let ref = newReference(this, path, "BUILT_PRODUCTS_DIR");
    ref.props.includeInIndex = 0;
    ref.setExplicitFileType();
    return ref;
  }

  static move(object: PBXFileReference | PBXGroup, newParent: PBXGroup) {
    assert(PBXGroup.is(newParent), "newParent must be a PBXGroup");

    assert(object, `Attempt to move nullish object to "${newParent.uuid}".`);
    assert(
      newParent,
      `Attempt to move object "${object.uuid}" to nullish parent.`
    );
    assert(
      newParent.uuid !== object.uuid,
      `Attempt to move object "${object.uuid}" to itself.`
    );
    assert(
      !getParents(newParent).find((parent) => parent.uuid === object.uuid),
      `Attempt to move object "${object.uuid}" to a child object "${newParent.uuid}".`
    );

    const currentParent = object.getParent();

    if (PBXGroup.is(currentParent)) {
      const index = currentParent.props.children.findIndex(
        (child) => child.uuid === object.uuid
      );
      if (index !== -1) {
        currentParent.props.children.splice(index, 1);
      }
    }

    newParent.props.children.push(object);
  }

  getParent(): PBXGroup | PBXProject {
    return getParent(this);
  }

  getParents(): (PBXGroup | PBXProject)[] {
    return getParents(this);
  }

  isReferencing(uuid: string): boolean {
    return !!this.props.children.find((child) => child.uuid === uuid);
  }

  removeReference(uuid: string) {
    const index = this.props.children.findIndex((child) => child.uuid === uuid);
    if (index !== -1) {
      this.props.children.splice(index, 1);
    }
  }

  getPath(): string {
    throw new Error("TODO");
  }

  createFile(
    opts: SansIsa<PickRequired<PBXFileReferenceModel, "path">>
  ): PBXFileReference {
    const fileReference = PBXFileReference.create(this.getXcodeProject(), opts);
    this.props.children.push(fileReference);
    return fileReference;
  }

  getDisplayName(): string {
    if (this.props.name) {
      return this.props.name;
    } else if (this.props.path) {
      return path.basename(this.props.path);
    } else if (this.uuid === this.project.props.mainGroup.uuid) {
      return "Main Group";
    }
    // Probably never happens
    return this.isa.replace(/^(PBX|XC)/, "");
  }
}

export type PBXGroupModel = json.PBXGroup<
  json.ISA.PBXGroup,
  PBXGroup | PBXReferenceProxy | PBXFileReference | PBXFileSystemSynchronizedRootGroup
>;

export class PBXGroup extends AbstractGroup<PBXGroupModel> {
  static isa = json.ISA.PBXGroup as const;
  static is(object: any): object is PBXGroup {
    return object.isa === PBXGroup.isa;
  }
  static create(project: XcodeProject, opts: Partial<SansIsa<PBXGroupModel>>) {
    return project.createModel<PBXGroupModel>({
      isa: PBXGroup.isa,
      children: [],
      sourceTree: "<group>",
      ...opts,
    }) as PBXGroup;
  }
}

/**
 * Creates a new file reference with the given path and adds it to the
 * given group.
 *
 * @param  group The group to which to add the reference.
 *
 * @param  path The, preferably absolute, path of the reference.
 *
 * @param  sourceTree The source tree key to use to configure the path.
 *
 * @return `PBXFileReference` The new file reference.
 */
function newFileReference(
  group: PBXGroup,
  filepath: string,
  sourceTree: json.SourceTree
): PBXFileReference {
  return group.createFile({
    path: filepath,
    sourceTree: sourceTree,
  });
}

/**
 * Creates a new reference with the given path and adds it to the
 * provided group. The reference is configured according to the extension
 * of the path.
 */
function newReference(
  group: PBXGroup,
  filePath: string,
  sourceTree: json.SourceTree
): PBXFileReference {
  const ref = (() => {
    switch (path.extname(filePath).toLowerCase()) {
      case ".xcdatamodeld":
      case ".xcodeproj":
        // TODO: maybe add this
        throw new Error("Unsupported file type: " + filePath);
      default:
        return newFileReference(group, filePath, sourceTree);
    }
  })();

  configureDefaultsForFileReference(ref);
  return ref;
}

/**
 * Configures a file reference according to the extension to math
 * Xcode behavior.
 *
 * @param  ref The file reference to configure.
 *
 * @note   To closely match the Xcode behavior the name attribute of
 *         the file reference is set only if the path of the file is
 *         not equal to the path of the group.
 */
function configureDefaultsForFileReference(ref: PBXFileReference) {
  if (ref.props.path?.includes("/")) {
    ref.props.name = ref.props.path.split("/").pop();
  }

  if (
    ref.props.path &&
    path.extname(ref.props.path).toLowerCase() == ".framework"
  ) {
    ref.props.includeInIndex = undefined;
  }
}
