import assert from "assert";
import { readFileSync, readdirSync, existsSync, unlinkSync, rmdirSync } from "fs";
import path from "path";
import crypto from "crypto";

import { XCScheme, createBuildableReference } from "./XCScheme";
import { XCSharedData } from "./XCSharedData";

import { parse } from "../json";
import * as json from "../json/types";
import { AbstractObject } from "./AbstractObject";

import type { ValueOf } from "./utils/util.types";
import type { PBXGroup } from "./AbstractGroup";
import type { PBXAggregateTarget } from "./PBXAggregateTarget";
import type { PBXBuildFile } from "./PBXBuildFile";
import type { PBXBuildRule } from "./PBXBuildRule";
import type { PBXContainerItemProxy } from "./PBXContainerItemProxy";
import type { PBXFileReference } from "./PBXFileReference";
import type { PBXLegacyTarget } from "./PBXLegacyTarget";
import type { PBXNativeTarget } from "./PBXNativeTarget";
import type { PBXProject } from "./PBXProject";
import type { PBXReferenceProxy } from "./PBXReferenceProxy";
import type {
  PBXAppleScriptBuildPhase,
  PBXCopyFilesBuildPhase,
  PBXFrameworksBuildPhase,
  PBXHeadersBuildPhase,
  PBXResourcesBuildPhase,
  PBXRezBuildPhase,
  PBXShellScriptBuildPhase,
  PBXSourcesBuildPhase,
} from "./PBXSourcesBuildPhase";
import type { PBXTargetDependency } from "./PBXTargetDependency";
import type { PBXVariantGroup } from "./PBXVariantGroup";
import type { XCBuildConfiguration } from "./XCBuildConfiguration";
import type { XCConfigurationList } from "./XCConfigurationList";
import type { XCVersionGroup } from "./XCVersionGroup";
import type { PBXFileSystemSynchronizedRootGroup } from "./PBXFileSystemSynchronizedRootGroup";
import type { PBXFileSystemSynchronizedBuildFileExceptionSet } from "./PBXFileSystemSynchronizedBuildFileExceptionSet";
import type { PBXFileSystemSynchronizedGroupBuildPhaseMembershipExceptionSet } from "./PBXFileSystemSynchronizedGroupBuildPhaseMembershipExceptionSet";
import {
  DEFAULT_OBJECT_VERSION,
  LAST_KNOWN_ARCHIVE_VERSION,
} from "./utils/constants";

const debug = require("debug")(
  "xcparse:model:XcodeProject"
) as typeof console.log;

function uuidForPath(path: string): string {
  return (
    // Xcode seems to make the first 7 and last 8 characters the same so we'll inch toward that.
    "XX" +
    crypto
      .createHash("md5")
      .update(path)
      .digest("hex")
      .toUpperCase()
      .slice(0, 20) +
    "XX"
  );
}

type IsaMapping = {
  [json.ISA.PBXBuildFile]: PBXBuildFile;
  [json.ISA.PBXAppleScriptBuildPhase]: PBXAppleScriptBuildPhase;
  [json.ISA.PBXCopyFilesBuildPhase]: PBXCopyFilesBuildPhase;
  [json.ISA.PBXFrameworksBuildPhase]: PBXFrameworksBuildPhase;
  [json.ISA.PBXHeadersBuildPhase]: PBXHeadersBuildPhase;
  [json.ISA.PBXResourcesBuildPhase]: PBXResourcesBuildPhase;
  [json.ISA.PBXShellScriptBuildPhase]: PBXShellScriptBuildPhase;
  [json.ISA.PBXSourcesBuildPhase]: PBXSourcesBuildPhase;
  [json.ISA.PBXContainerItemProxy]: PBXContainerItemProxy;
  [json.ISA.PBXFileReference]: PBXFileReference;
  [json.ISA.PBXGroup]: PBXGroup;
  [json.ISA.PBXVariantGroup]: PBXVariantGroup;
  [json.ISA.XCVersionGroup]: XCVersionGroup;
  [json.ISA
    .PBXFileSystemSynchronizedRootGroup]: PBXFileSystemSynchronizedRootGroup;
  [json.ISA
    .PBXFileSystemSynchronizedBuildFileExceptionSet]: PBXFileSystemSynchronizedBuildFileExceptionSet;
  [json.ISA
    .PBXFileSystemSynchronizedGroupBuildPhaseMembershipExceptionSet]: PBXFileSystemSynchronizedGroupBuildPhaseMembershipExceptionSet;
  [json.ISA.PBXNativeTarget]: PBXNativeTarget;
  [json.ISA.PBXAggregateTarget]: PBXAggregateTarget;
  [json.ISA.PBXLegacyTarget]: PBXLegacyTarget;
  [json.ISA.PBXProject]: PBXProject;
  [json.ISA.PBXTargetDependency]: PBXTargetDependency;
  [json.ISA.XCBuildConfiguration]: XCBuildConfiguration;
  [json.ISA.XCConfigurationList]: XCConfigurationList;
  [json.ISA.PBXBuildRule]: PBXBuildRule;
  [json.ISA.PBXReferenceProxy]: PBXReferenceProxy;
  [json.ISA.PBXRezBuildPhase]: PBXRezBuildPhase;
};

const KNOWN_ISA = {
  [json.ISA.PBXBuildFile]: () =>
    require("./PBXBuildFile")
      .PBXBuildFile as typeof import("./PBXBuildFile").PBXBuildFile,
  [json.ISA.PBXAppleScriptBuildPhase]: () =>
    require("./PBXSourcesBuildPhase")
      .PBXAppleScriptBuildPhase as typeof import("./PBXSourcesBuildPhase").PBXAppleScriptBuildPhase,
  [json.ISA.PBXCopyFilesBuildPhase]: () =>
    require("./PBXSourcesBuildPhase")
      .PBXCopyFilesBuildPhase as typeof import("./PBXSourcesBuildPhase").PBXCopyFilesBuildPhase,
  [json.ISA.PBXFrameworksBuildPhase]: () =>
    require("./PBXSourcesBuildPhase")
      .PBXFrameworksBuildPhase as typeof import("./PBXSourcesBuildPhase").PBXFrameworksBuildPhase,
  [json.ISA.PBXHeadersBuildPhase]: () =>
    require("./PBXSourcesBuildPhase")
      .PBXHeadersBuildPhase as typeof import("./PBXSourcesBuildPhase").PBXHeadersBuildPhase,
  [json.ISA.PBXResourcesBuildPhase]: () =>
    require("./PBXSourcesBuildPhase")
      .PBXResourcesBuildPhase as typeof import("./PBXSourcesBuildPhase").PBXResourcesBuildPhase,
  [json.ISA.PBXShellScriptBuildPhase]: () =>
    require("./PBXSourcesBuildPhase")
      .PBXShellScriptBuildPhase as typeof import("./PBXSourcesBuildPhase").PBXShellScriptBuildPhase,
  [json.ISA.PBXSourcesBuildPhase]: () =>
    require("./PBXSourcesBuildPhase")
      .PBXSourcesBuildPhase as typeof import("./PBXSourcesBuildPhase").PBXSourcesBuildPhase,
  [json.ISA.PBXContainerItemProxy]: () =>
    require("./PBXContainerItemProxy")
      .PBXContainerItemProxy as typeof import("./PBXContainerItemProxy").PBXContainerItemProxy,
  [json.ISA.PBXFileReference]: () =>
    require("./PBXFileReference")
      .PBXFileReference as typeof import("./PBXFileReference").PBXFileReference,
  [json.ISA.PBXGroup]: () =>
    require("./AbstractGroup")
      .PBXGroup as typeof import("./AbstractGroup").PBXGroup,
  [json.ISA.PBXVariantGroup]: () =>
    require("./PBXVariantGroup")
      .PBXVariantGroup as typeof import("./PBXVariantGroup").PBXVariantGroup,
  [json.ISA.XCVersionGroup]: () =>
    require("./XCVersionGroup")
      .XCVersionGroup as typeof import("./XCVersionGroup").XCVersionGroup,
  [json.ISA.PBXFileSystemSynchronizedRootGroup]: () =>
    require("./PBXFileSystemSynchronizedRootGroup")
      .PBXFileSystemSynchronizedRootGroup as typeof import("./PBXFileSystemSynchronizedRootGroup").PBXFileSystemSynchronizedRootGroup,
  [json.ISA.PBXFileSystemSynchronizedBuildFileExceptionSet]: () =>
    require("./PBXFileSystemSynchronizedBuildFileExceptionSet")
      .PBXFileSystemSynchronizedBuildFileExceptionSet as typeof import("./PBXFileSystemSynchronizedBuildFileExceptionSet").PBXFileSystemSynchronizedBuildFileExceptionSet,
  [json.ISA.PBXFileSystemSynchronizedGroupBuildPhaseMembershipExceptionSet]:
    () =>
      require("./PBXFileSystemSynchronizedGroupBuildPhaseMembershipExceptionSet")
        .PBXFileSystemSynchronizedGroupBuildPhaseMembershipExceptionSet as typeof import("./PBXFileSystemSynchronizedGroupBuildPhaseMembershipExceptionSet").PBXFileSystemSynchronizedGroupBuildPhaseMembershipExceptionSet,
  [json.ISA.PBXNativeTarget]: () =>
    require("./PBXNativeTarget")
      .PBXNativeTarget as typeof import("./PBXNativeTarget").PBXNativeTarget,
  [json.ISA.PBXAggregateTarget]: () =>
    require("./PBXAggregateTarget")
      .PBXAggregateTarget as typeof import("./PBXAggregateTarget").PBXAggregateTarget,
  [json.ISA.PBXLegacyTarget]: () =>
    require("./PBXLegacyTarget")
      .PBXLegacyTarget as typeof import("./PBXLegacyTarget").PBXLegacyTarget,
  [json.ISA.PBXProject]: () =>
    require("./PBXProject")
      .PBXProject as typeof import("./PBXProject").PBXProject,
  [json.ISA.PBXTargetDependency]: () =>
    require("./PBXTargetDependency")
      .PBXTargetDependency as typeof import("./PBXTargetDependency").PBXTargetDependency,
  [json.ISA.XCBuildConfiguration]: () =>
    require("./XCBuildConfiguration")
      .XCBuildConfiguration as typeof import("./XCBuildConfiguration").XCBuildConfiguration,
  [json.ISA.XCConfigurationList]: () =>
    require("./XCConfigurationList")
      .XCConfigurationList as typeof import("./XCConfigurationList").XCConfigurationList,
  [json.ISA.PBXBuildRule]: () =>
    require("./PBXBuildRule")
      .PBXBuildRule as typeof import("./PBXBuildRule").PBXBuildRule,
  [json.ISA.PBXReferenceProxy]: () =>
    require("./PBXReferenceProxy")
      .PBXReferenceProxy as typeof import("./PBXReferenceProxy").PBXReferenceProxy,
  [json.ISA.PBXRezBuildPhase]: () =>
    require("./PBXSourcesBuildPhase")
      .PBXRezBuildPhase as typeof import("./PBXSourcesBuildPhase").PBXRezBuildPhase,
  [json.ISA.XCSwiftPackageProductDependency]: () =>
    require("./XCSwiftPackageProductDependency")
      .XCSwiftPackageProductDependency,
  [json.ISA.XCRemoteSwiftPackageReference]: () =>
    require("./XCRemoteSwiftPackageReference").XCRemoteSwiftPackageReference,
  [json.ISA.XCLocalSwiftPackageReference]: () =>
    require("./XCLocalSwiftPackageReference").XCLocalSwiftPackageReference,
} as const;

type AnyModel = ValueOf<IsaMapping>;

export class XcodeProject extends Map<json.UUID, AnyModel> {
  /**
   * Versioning system for the entire archive.
   * @example `1`
   */
  archiveVersion: number;
  /**
   * Versioning system for the `objects` dictionary.
   * @example `55`
   */
  objectVersion: number;

  /** UUID for the initial object in the `objects` dictionary. */
  rootObject: PBXProject;
  /** No idea what this does, I've Googled it a bit. */
  classes: Record<json.UUID, unknown>;

  /** JSON objects which haven't been inflated yet */
  private internalJsonObjects: Record<json.UUID, json.AbstractObject<any>>;

  /**
   * @param filePath -- path to a `pbxproj` file.
   * @returns a new instance of `XcodeProject`
   */
  static open(filePath: string) {
    const contents = readFileSync(filePath, "utf8");
    const json = parse(contents);
    return new XcodeProject(filePath, json);
  }

  constructor(public filePath: string, props: Partial<json.XcodeProject>) {
    super();

    const json = JSON.parse(JSON.stringify(props));
    assert(json.objects, "objects is required");
    assert(json.rootObject, "rootObject is required");

    this.internalJsonObjects = json.objects;
    this.archiveVersion = json.archiveVersion ?? LAST_KNOWN_ARCHIVE_VERSION;
    this.objectVersion = json.objectVersion ?? DEFAULT_OBJECT_VERSION;
    this.classes = json.classes ?? {};

    // Sanity
    assertRootObject(json.rootObject, json.objects?.[json.rootObject]);

    // Inflate the root object.
    this.rootObject = this.getObject(json.rootObject);
    // This should never be needed in a compliant project.
    this.ensureAllObjectsInflated();
  }

  /** The directory containing the `*.xcodeproj/project.pbxproj` file, e.g. `/ios/` in React Native. */
  getProjectRoot() {
    // TODO: Not sure if this is right
    return path.dirname(path.dirname(this.filePath));
  }

  getObject(uuid: string) {
    const obj = this._getObjectOptional(uuid);
    if (obj) {
      return obj;
    }
    throw new Error(`object with uuid '${uuid}' not found.`);
  }

  private _getObjectOptional(uuid: string) {
    if (this.has(uuid)) {
      return this.get(uuid);
    }
    const obj = this.internalJsonObjects[uuid];
    if (!obj) {
      return null;
    }
    // Clear out so we known this model has already been inflated.
    delete this.internalJsonObjects[uuid];

    const model = this.createObject(uuid, obj);
    this.set(uuid, model);
    // Inflate after the model has been registered.
    model.inflate();
    return model;
  }

  createObject<
    TKlass extends json.AbstractObject<any>,
    TInstance = InstanceType<IsaMapping[TKlass["isa"]]>
  >(uuid: string, obj: TKlass): TInstance {
    // @ts-expect-error
    const Klass = KNOWN_ISA[obj.isa]();
    assert(Klass, `unknown object type. (isa: ${obj.isa}, uuid: ${uuid})`);

    return new Klass(
      this,
      uuid,

      obj
    );
  }

  private ensureAllObjectsInflated() {
    // This method exists for sanity
    if (Object.keys(this.internalJsonObjects).length === 0) return;

    debug(
      "inflating unreferenced objects: %o",
      Object.keys(this.internalJsonObjects)
    );
    while (Object.keys(this.internalJsonObjects).length > 0) {
      const uuid = Object.keys(this.internalJsonObjects)[0];
      this.getObject(uuid);
    }
  }

  createModel<TProps extends json.AbstractObject<any>>(opts: TProps) {
    const uuid = this.getUniqueId(JSON.stringify(canonicalize(opts)));
    const model = this.createObject(uuid, opts);
    this.set(uuid, model);
    return model;
  }

  getReferenceForPath(absolutePath: string): PBXFileReference | null {
    if (!path.isAbsolute(absolutePath)) {
      throw new Error(`Paths must be absolute ${absolutePath}`);
    }

    for (const child of this.values()) {
      if (
        child.isa === "PBXFileReference" &&
        "getRealPath" in child &&
        child.getRealPath() === absolutePath
      ) {
        return child;
      }
    }
    return null;
  }

  getReferrers(uuid: string): AbstractObject[] {
    let referrers = [];
    for (const child of this.values()) {
      if (child.isReferencing(uuid)) {
        referrers.push(child);
      }
    }
    return referrers;
  }

  private isUniqueId(id: string): boolean {
    for (const key of this.keys()) {
      if (key === id) {
        return false;
      }
    }
    return true;
  }

  private getUniqueId(seed: string): string {
    const id = uuidForPath(seed);
    if (this.isUniqueId(id)) {
      return id;
    }
    return this.getUniqueId(
      // Add a space to the seed to increase the hash.
      seed + " "
    );
  }

  // ============================================================================
  // Scheme Methods
  // ============================================================================

  /**
   * Get the directory containing shared schemes.
   */
  getSharedSchemesDir(): string {
    const projectDir = path.dirname(this.filePath);
    return path.join(projectDir, "xcshareddata", "xcschemes");
  }

  /**
   * Get the directory containing user schemes for a specific user.
   */
  getUserSchemesDir(username: string): string {
    const projectDir = path.dirname(this.filePath);
    return path.join(
      projectDir,
      "xcuserdata",
      `${username}.xcuserdatad`,
      "xcschemes"
    );
  }

  /**
   * Get all schemes (shared + user) for this project.
   *
   * @param options.includeUser Whether to include user schemes (requires username)
   * @param options.username Username for user schemes
   */
  getSchemes(options?: {
    includeUser?: boolean;
    username?: string;
  }): XCScheme[] {
    const schemes: XCScheme[] = [];

    // Get shared schemes
    const sharedDir = this.getSharedSchemesDir();
    if (existsSync(sharedDir)) {
      const files = readdirSync(sharedDir).filter((f) =>
        f.endsWith(".xcscheme")
      );
      for (const file of files) {
        schemes.push(XCScheme.open(path.join(sharedDir, file)));
      }
    }

    // Get user schemes if requested
    if (options?.includeUser && options?.username) {
      const userDir = this.getUserSchemesDir(options.username);
      if (existsSync(userDir)) {
        const files = readdirSync(userDir).filter((f) =>
          f.endsWith(".xcscheme")
        );
        for (const file of files) {
          schemes.push(XCScheme.open(path.join(userDir, file)));
        }
      }
    }

    return schemes;
  }

  /**
   * Get a scheme by name.
   *
   * @param name The scheme name (without .xcscheme extension)
   * @param options.username Optional username to check user schemes
   */
  getScheme(
    name: string,
    options?: { username?: string }
  ): XCScheme | null {
    const fileName = name.endsWith(".xcscheme") ? name : `${name}.xcscheme`;

    // Check shared schemes first
    const sharedPath = path.join(this.getSharedSchemesDir(), fileName);
    if (existsSync(sharedPath)) {
      return XCScheme.open(sharedPath);
    }

    // Check user schemes if username provided
    if (options?.username) {
      const userPath = path.join(
        this.getUserSchemesDir(options.username),
        fileName
      );
      if (existsSync(userPath)) {
        return XCScheme.open(userPath);
      }
    }

    return null;
  }

  /**
   * Save a scheme to disk.
   *
   * @param scheme The scheme to save
   * @param options.shared Whether to save as shared scheme (default: true)
   * @param options.username Required if shared=false
   */
  saveScheme(
    scheme: XCScheme,
    options?: { shared?: boolean; username?: string }
  ): void {
    const isShared = options?.shared ?? true;
    const fileName = `${scheme.name}.xcscheme`;

    let targetDir: string;
    if (isShared) {
      targetDir = this.getSharedSchemesDir();
    } else {
      if (!options?.username) {
        throw new Error("username is required when saving a user scheme");
      }
      targetDir = this.getUserSchemesDir(options.username);
    }

    const targetPath = path.join(targetDir, fileName);
    scheme.save(targetPath);
  }

  /**
   * Delete a scheme.
   *
   * @param name The scheme name (without .xcscheme extension)
   * @param options.shared Whether to delete from shared schemes (default: true)
   * @param options.username Required if shared=false
   */
  deleteScheme(
    name: string,
    options?: { shared?: boolean; username?: string }
  ): void {
    const isShared = options?.shared ?? true;
    const fileName = `${name}.xcscheme`;

    let targetDir: string;
    if (isShared) {
      targetDir = this.getSharedSchemesDir();
    } else {
      if (!options?.username) {
        throw new Error("username is required when deleting a user scheme");
      }
      targetDir = this.getUserSchemesDir(options.username);
    }

    const targetPath = path.join(targetDir, fileName);
    if (existsSync(targetPath)) {
      unlinkSync(targetPath);
    }
  }

  /**
   * Create a basic scheme for a target.
   *
   * @param target The target to create a scheme for
   * @param name Optional custom scheme name (defaults to target name)
   */
  createSchemeForTarget(target: PBXNativeTarget, name?: string): XCScheme {
    const projectDir = path.dirname(this.filePath);
    const projectName = path.basename(projectDir);
    return XCScheme.createForTarget(
      target,
      name,
      `${projectName}`
    );
  }

  // ============================================================================
  // Shared Data Methods
  // ============================================================================

  /**
   * Get the path to the xcshareddata directory.
   */
  getSharedDataDir(): string {
    const projectDir = path.dirname(this.filePath);
    return path.join(projectDir, "xcshareddata");
  }

  /**
   * Get the XCSharedData instance for this project.
   *
   * @returns XCSharedData for accessing schemes, breakpoints, and settings
   */
  getSharedData(): XCSharedData {
    const sharedDataDir = this.getSharedDataDir();
    if (existsSync(sharedDataDir)) {
      return XCSharedData.open(sharedDataDir);
    }
    // Create a new instance with the path set
    const sharedData = XCSharedData.create();
    sharedData.filePath = sharedDataDir;
    return sharedData;
  }

  toJSON(): json.XcodeProject {
    const json: json.XcodeProject = {
      archiveVersion: this.archiveVersion,
      objectVersion: this.objectVersion,
      classes: this.classes,
      objects: {},
      rootObject: this.rootObject.uuid,
    };

    // Inflate all objects.
    for (const [uuid, obj] of this.entries()) {
      json.objects[uuid] = obj.toJSON();
    }

    return json;
  }
}

function assertRootObject(
  id: string,
  obj: any
): asserts obj is json.PBXProject {
  if (obj?.isa !== "PBXProject") {
    throw new Error(`Root object "${id}" is not a PBXProject`);
  }
}

function canonicalize(value: any): any {
  // Deep sort serialized `value` object to make it deterministic.
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  } else if (typeof value === "object") {
    if ("uuid" in value && typeof value.uuid === "string") {
      return value.uuid;
    }
    const sorted: Record<string, any> = {};
    for (const key of Object.keys(value).sort()) {
      sorted[key] = canonicalize(value[key]);
    }
    return sorted;
  } else {
    return value;
  }
}
