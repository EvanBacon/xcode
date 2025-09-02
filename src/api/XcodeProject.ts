import assert from "assert";
import { readFileSync } from "fs";
import path from "path";
import crypto from "crypto";

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

  /**
   * Optimized open method for large projects
   * @param filePath -- path to a `pbxproj` file
   * @param options -- optimization options
   */
  static openLazy(filePath: string, options: {
    skipFullInflation?: boolean;
    progressCallback?: (message: string) => void;
  } = {}) {
    const { skipFullInflation = true, progressCallback } = options;
    
    progressCallback?.('Reading file...');
    console.time('📁 File read');
    const contents = readFileSync(filePath, "utf8");
    console.timeEnd('📁 File read');
    
    progressCallback?.('Parsing JSON...');
    console.time('🔍 JSON parsing');
    const json = parse(contents);
    console.timeEnd('🔍 JSON parsing');
    
    const objectCount = Object.keys(json.objects || {}).length;
    console.log(`📊 Found ${objectCount.toLocaleString()} objects`);
    
    progressCallback?.('Creating project...');
    console.time('🏗️  Project creation');
    const project = new XcodeProject(filePath, json, { skipFullInflation });
    console.timeEnd('🏗️  Project creation');
    
    return project;
  }

  constructor(
    public filePath: string, 
    props: Partial<json.XcodeProject>, 
    options: { skipFullInflation?: boolean } = {}
  ) {
    super();

    const { skipFullInflation = false } = options;

    // Optimize: avoid deep clone for large projects
    const json = skipFullInflation ? props : JSON.parse(JSON.stringify(props));
    assert(json.objects, "objects is required");
    assert(json.rootObject, "rootObject is required");

    this.internalJsonObjects = json.objects;
    this.archiveVersion = json.archiveVersion ?? LAST_KNOWN_ARCHIVE_VERSION;
    this.objectVersion = json.objectVersion ?? DEFAULT_OBJECT_VERSION;
    this.classes = json.classes ?? {};

    // Sanity
    assertRootObject(json.rootObject, json.objects?.[json.rootObject]);

    // Inflate the root object.
    console.time('🌱 Root object inflation');
    this.rootObject = this.getObject(json.rootObject);
    console.timeEnd('🌱 Root object inflation');

    // Skip full inflation for large projects
    if (!skipFullInflation) {
      console.time('🌳 Full object inflation');
      this.ensureAllObjectsInflated();
      console.timeEnd('🌳 Full object inflation');
    } else {
      const remainingCount = Object.keys(this.internalJsonObjects).length;
      console.log(`⏭️  Skipping full inflation of ${remainingCount.toLocaleString()} objects (lazy mode)`);
    }
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

    const remaining = Object.keys(this.internalJsonObjects).length;
    debug("inflating unreferenced objects: %o", Object.keys(this.internalJsonObjects));
    
    let processed = 0;
    while (Object.keys(this.internalJsonObjects).length > 0) {
      const uuid = Object.keys(this.internalJsonObjects)[0];
      this.getObject(uuid);
      processed++;
      
      // Progress for large batches
      if (remaining > 1000 && processed % 500 === 0) {
        console.log(`   ⚙️  Inflated ${processed}/${remaining} objects...`);
      }
    }
  }

  /**
   * Manually trigger full inflation of all objects (for lazy-loaded projects)
   */
  forceFullInflation(progressCallback?: (processed: number, total: number) => void) {
    const remaining = Object.keys(this.internalJsonObjects).length;
    if (remaining === 0) {
      console.log('✅ All objects already inflated');
      return;
    }

    console.log(`🔄 Force inflating ${remaining.toLocaleString()} remaining objects...`);
    console.time('🌳 Full inflation');
    
    let processed = 0;
    while (Object.keys(this.internalJsonObjects).length > 0) {
      const uuid = Object.keys(this.internalJsonObjects)[0];
      this.getObject(uuid);
      processed++;
      
      if (progressCallback && processed % 100 === 0) {
        progressCallback(processed, remaining);
      }
    }
    
    console.timeEnd('🌳 Full inflation');
    console.log('✅ Full inflation completed');
  }

  /**
   * Get project statistics without full inflation
   */
  getQuickStats() {
    const totalObjects = this.size + Object.keys(this.internalJsonObjects).length;
    const inflatedObjects = this.size;
    const uninflatedObjects = Object.keys(this.internalJsonObjects).length;

    return {
      totalObjects,
      inflatedObjects,
      uninflatedObjects,
      inflationPercentage: ((inflatedObjects / totalObjects) * 100).toFixed(1)
    };
  }

  /**
   * Get uninflated objects for analysis (read-only access)
   */
  getUninflatedObjects(): Readonly<Record<json.UUID, json.AbstractObject<any>>> {
    return this.internalJsonObjects;
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
