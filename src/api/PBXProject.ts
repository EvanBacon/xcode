import path from "path";

import { PROJECT_DEFAULT_BUILD_SETTINGS } from "./utils/constants";
import * as json from "../json/types";
import { AbstractObject } from "./AbstractObject";
import { PBXNativeTarget } from "./PBXNativeTarget";
import { XCBuildConfiguration } from "./XCBuildConfiguration";

import type { PickRequired, SansIsa } from "./utils/util.types";
import type { PBXGroup } from "./AbstractGroup";
import type { XcodeProject } from "./XcodeProject";
import type { PBXAggregateTarget } from "./PBXAggregateTarget";
import type { PBXLegacyTarget } from "./PBXLegacyTarget";
import type { XCConfigurationList } from "./XCConfigurationList";
import type { XCRemoteSwiftPackageReference } from "./XCRemoteSwiftPackageReference";
export class PBXProject extends AbstractObject<
  json.PBXProject<
    XCConfigurationList,
    PBXGroup,
    PBXGroup,
    /* any target */
    PBXAggregateTarget | PBXLegacyTarget | PBXNativeTarget,
    XCRemoteSwiftPackageReference
  >
> {
  static isa = json.ISA.PBXProject as const;
  static is(object: any): object is PBXProject {
    return object.isa === PBXProject.isa;
  }
  static create(project: XcodeProject, opts: SansIsa<json.PBXProject>) {
    return project.createModel<json.PBXProject>({
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

  protected setupDefaults(
    props: json.PBXProject<
      XCConfigurationList,
      PBXGroup,
      PBXGroup,
      PBXAggregateTarget | PBXLegacyTarget | PBXNativeTarget,
      XCRemoteSwiftPackageReference
    >
  ): void {
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
    if (props.attributes) {
      props.attributes = {
        LastSwiftUpdateCheck: "1300",
        LastUpgradeCheck: "1300",
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

  createNativeTarget(
    json: PickRequired<
      SansIsa<json.PBXNativeTarget>,
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

  isReferencing(uuid: string): boolean {
    if (
      [
        this.props.mainGroup.uuid,
        this.props.buildConfigurationList.uuid,
        this.props.productRefGroup?.uuid,
      ].includes(uuid)
    ) {
      return true;
    }
    return !!this.props.targets.find((target) => target.uuid === uuid);
  }
}
