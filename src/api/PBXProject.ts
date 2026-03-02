import path from "path";

import {
  LAST_SWIFT_UPGRADE_CHECK,
  LAST_UPGRADE_CHECK,
  PROJECT_DEFAULT_BUILD_SETTINGS,
} from "./utils/constants";
import * as json from "../json/types";
import { AbstractObject } from "./AbstractObject";
import { PBXNativeTarget, PBXNativeTargetModel } from "./PBXNativeTarget";
import { XCBuildConfiguration } from "./XCBuildConfiguration";
import { XCRemoteSwiftPackageReference } from "./XCRemoteSwiftPackageReference";
import { XCLocalSwiftPackageReference } from "./XCLocalSwiftPackageReference";

import type { PickRequired, SansIsa } from "./utils/util.types";
import type { PBXGroup } from "./AbstractGroup";
import type { XcodeProject } from "./XcodeProject";
import type { PBXAggregateTarget } from "./PBXAggregateTarget";
import type { PBXLegacyTarget } from "./PBXLegacyTarget";
import type { XCConfigurationList } from "./XCConfigurationList";

export type PBXProjectModel = json.PBXProject<
  XCConfigurationList,
  PBXGroup,
  PBXGroup,
  /* any target */
  PBXAggregateTarget | PBXLegacyTarget | PBXNativeTarget,
  XCRemoteSwiftPackageReference | XCLocalSwiftPackageReference
>;

export class PBXProject extends AbstractObject<PBXProjectModel> {
  static isa = json.ISA.PBXProject as const;
  static is(object: any): object is PBXProject {
    return object.isa === PBXProject.isa;
  }
  static create(project: XcodeProject, opts: SansIsa<PBXProjectModel>) {
    return project.createModel<PBXProjectModel>({
      isa: PBXProject.isa,
      ...opts,
    }) as PBXProject;
  }

  protected getObjectProps(): Partial<{
    buildConfigurationList: any;
    compatibilityVersion: any;
    developmentRegion?: any;
    hasScannedForEncodings?: any;
    knownRegions: any;
    mainGroup: any;
    productRefGroup?: any;
    projectDirPath: any;
    projectRoot: any;
    targets: any;
    packageReferences?: any;
  }> {
    return {
      buildConfigurationList: String,
      mainGroup: String,
      productRefGroup: String,
      targets: [String],
      packageReferences: [String],
    };
  }

  protected setupDefaults(props: PBXProjectModel): void {
    if (!props.compatibilityVersion) {
      props.compatibilityVersion = "Xcode 3.2";
    }
    if (!props.developmentRegion) {
      props.developmentRegion = "en";
    }
    if (!props.hasScannedForEncodings) {
      props.hasScannedForEncodings = 0;
    }
    if (!props.knownRegions) {
      props.knownRegions = ["en", "Base"];
    }
    if (!props.projectDirPath) {
      props.projectDirPath = "";
    }
    if (!props.projectRoot) {
      props.projectRoot = "";
    }
    if (!props.attributes) {
      props.attributes = {
        LastSwiftUpdateCheck: LAST_SWIFT_UPGRADE_CHECK,
        LastUpgradeCheck: LAST_UPGRADE_CHECK,
        TargetAttributes: {},
      };
    }
  }

  addBuildConfiguration(
    name: string,
    type: keyof typeof PROJECT_DEFAULT_BUILD_SETTINGS
  ) {
    let configList = this.props.buildConfigurationList;

    const has = configList.props.buildConfigurations.find(
      (config) => config.props.name === name
    );
    if (has) return has;

    const config = XCBuildConfiguration.create(this.getXcodeProject(), {
      name,
      buildSettings: {
        ...JSON.parse(JSON.stringify(PROJECT_DEFAULT_BUILD_SETTINGS.all)),
        ...JSON.parse(JSON.stringify(PROJECT_DEFAULT_BUILD_SETTINGS[type])),
      },
    });

    configList.props.buildConfigurations.push(config);
    return config;
  }

  getName() {
    return path.basename(this.getXcodeProject().filePath, ".xcodeproj");
  }

  /**
   * Get or create the 'Products' group set as the `productRefGroup`.
   *
   * @returns The `productRefGroup` or a new group if it doesn't exist.
   */
  ensureProductGroup(): PBXGroup {
    if (this.props.productRefGroup) {
      return this.props.productRefGroup;
    }

    // Create a "Products" group
    const group = this.props.mainGroup.createGroup({
      name: "Products",
      sourceTree: "<group>",
    });
    this.props.productRefGroup = group;
    return group;
  }

  /**
   * Get or create the child group for a given name in the `mainGroup`. Useful for querying the `'Frameworks'` group.
   *
   * @returns The main group child group for the given `name` or a new group if it doesn't exist.
   */
  ensureMainGroupChild(name: string): PBXGroup {
    return (
      this.props.mainGroup
        .getChildGroups()
        .find((group) => group.getDisplayName() === name) ??
      // If this happens for the 'Frameworks' group, there's a big problem. But just in case...
      this.props.mainGroup.createGroup({
        name: name,
        sourceTree: "<group>",
      })
    );
  }

  /** @returns the `Frameworks` group and ensuring it exists. */
  getFrameworksGroup(): PBXGroup {
    return this.ensureMainGroupChild("Frameworks");
  }

  createNativeTarget(
    json: PickRequired<
      SansIsa<PBXNativeTargetModel>,
      "name" | "productType" | "buildConfigurationList"
    >
  ) {
    const file = PBXNativeTarget.create(this.getXcodeProject(), json);
    this.props.targets.push(file);
    return file;
  }

  getNativeTarget(type: json.PBXProductType): PBXNativeTarget | null {
    for (const target of this.props.targets) {
      if (PBXNativeTarget.is(target) && target.props.productType === type) {
        return target;
      }
    }
    return null;
  }

  /** Best effort helper method to return the main target for a given app type. */
  getMainAppTarget(
    type: "ios" | "macos" | "tvos" | "watchos" = "ios"
  ): PBXNativeTarget | null {
    const MAPPING: Record<string, keyof json.BuildSettings> = {
      ios: "IPHONEOS_DEPLOYMENT_TARGET",
      macos: "MACOSX_DEPLOYMENT_TARGET",
      tvos: "TVOS_DEPLOYMENT_TARGET",
      watchos: "WATCHOS_DEPLOYMENT_TARGET",
    };

    const targetBuildSetting = MAPPING[type];

    const anyAppTarget = this.props.targets.filter((target) => {
      return (
        PBXNativeTarget.is(target) &&
        target.props.productType === "com.apple.product-type.application"
      );
    }) as PBXNativeTarget[];

    const mainAppTarget = anyAppTarget.filter((target) => {
      // TODO: This needs to support `baseConfigurationReference` too, otherwise all the settings won't be present.
      const config = target.getDefaultConfiguration();
      // WatchOS apps look very similar to iOS apps, but they have a different deployment target
      return targetBuildSetting in config.props.buildSettings;
    }) as PBXNativeTarget[];

    if (mainAppTarget.length > 1) {
      console.warn(
        `Multiple main app targets found, using first one: ${mainAppTarget
          .map((t) => t.getDisplayName())
          .join(", ")}`
      );
    }

    const target = mainAppTarget[0];

    if (!target) {
      // NOTE: This is a fallback since we don't support `baseConfigurationReference` yet.
      if (type === "ios" && anyAppTarget.length) {
        return anyAppTarget[0];
      }
      throw new Error("No main app target found");
    }
    return target;
  }

  removeReference(uuid: string) {
    super.removeReference(uuid);

    // Also remove from TargetAttributes if present
    if (this.props.attributes?.TargetAttributes?.[uuid]) {
      delete this.props.attributes.TargetAttributes[uuid];
    }
  }

  /**
   * Adds a Swift package reference to the project if not already present.
   *
   * @param packageRef The package reference to add (XCRemoteSwiftPackageReference or XCLocalSwiftPackageReference)
   * @returns The package reference
   */
  addPackageReference(
    packageRef: XCRemoteSwiftPackageReference | XCLocalSwiftPackageReference
  ): XCRemoteSwiftPackageReference | XCLocalSwiftPackageReference {
    if (!this.props.packageReferences) {
      this.props.packageReferences = [];
    }

    // Check if already added
    const existing = this.props.packageReferences.find(
      (ref) => ref.uuid === packageRef.uuid
    );
    if (existing) {
      return existing;
    }

    this.props.packageReferences.push(packageRef);
    return packageRef;
  }

  /**
   * Gets an existing package reference by repository URL (for remote) or relative path (for local).
   *
   * @param identifier The repository URL or relative path to search for
   * @returns The package reference if found, null otherwise
   */
  getPackageReference(
    identifier: string
  ): XCRemoteSwiftPackageReference | XCLocalSwiftPackageReference | null {
    if (!this.props.packageReferences) {
      return null;
    }

    for (const ref of this.props.packageReferences) {
      if (
        XCRemoteSwiftPackageReference.is(ref) &&
        ref.props.repositoryURL === identifier
      ) {
        return ref;
      }
      if (
        XCLocalSwiftPackageReference.is(ref) &&
        ref.props.relativePath === identifier
      ) {
        return ref;
      }
    }

    return null;
  }

  /**
   * Creates and adds a remote Swift package reference to the project.
   *
   * @param opts Options for creating the remote package reference
   * @returns The created or existing package reference
   */
  addRemoteSwiftPackage(
    opts: SansIsa<json.XCRemoteSwiftPackageReference>
  ): XCRemoteSwiftPackageReference {
    // Check if package already exists
    if (opts.repositoryURL) {
      const existing = this.getPackageReference(opts.repositoryURL);
      if (existing && XCRemoteSwiftPackageReference.is(existing)) {
        return existing;
      }
    }

    const packageRef = XCRemoteSwiftPackageReference.create(
      this.getXcodeProject(),
      opts
    );
    this.addPackageReference(packageRef);
    return packageRef;
  }

  /**
   * Creates and adds a local Swift package reference to the project.
   *
   * @param opts Options for creating the local package reference
   * @returns The created or existing package reference
   */
  addLocalSwiftPackage(
    opts: SansIsa<json.XCLocalSwiftPackageReference>
  ): XCLocalSwiftPackageReference {
    // Check if package already exists
    const existing = this.getPackageReference(opts.relativePath);
    if (existing && XCLocalSwiftPackageReference.is(existing)) {
      return existing;
    }

    const packageRef = XCLocalSwiftPackageReference.create(
      this.getXcodeProject(),
      opts
    );
    this.addPackageReference(packageRef);
    return packageRef;
  }
}
