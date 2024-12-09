import * as json from "../json/types";
import { AbstractObject } from "./AbstractObject";
import {
  XCBuildConfiguration,
  XCBuildConfigurationModel,
} from "./XCBuildConfiguration";
import {
  XCConfigurationList,
  XCConfigurationListModel,
} from "./XCConfigurationList";

import type { PickRequired, SansIsa } from "./utils/util.types";
import type {
  AnyBuildPhase,
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

export class AbstractTarget<
  TJSON extends json.AbstractTarget<
    any,
    XCConfigurationList,
    PBXTargetDependency,
    AnyBuildPhase
  >
> extends AbstractObject<TJSON> {
  createConfigurationList(
    listOptions: PickRequired<
      Omit<XCConfigurationListModel, "isa" | "buildConfigurations">,
      "defaultConfigurationName"
    >,
    configurations: Omit<XCBuildConfigurationModel, "isa">[]
  ) {
    const objects = configurations.map((config) =>
      XCBuildConfiguration.create(this.getXcodeProject(), config)
    );
    const list = XCConfigurationList.create(this.getXcodeProject(), {
      buildConfigurations: objects,
      ...listOptions,
    });

    this.props.buildConfigurationList = list;

    return list;
  }

  /**
   * Checks whether this target has a dependency on the given target.
   */

  getDependencyForTarget(
    target: AbstractTarget<any>
  ): PBXTargetDependency | undefined {
    return this.props.dependencies.find((dep) => {
      if (dep.props.targetProxy.isRemote()) {
        const subprojectReference = this.getXcodeProject().getReferenceForPath(
          target.getXcodeProject().filePath
        );

        if (subprojectReference) {
          const uuid = subprojectReference.uuid;
          return (
            dep.props.targetProxy.props.remoteGlobalIDString === target.uuid &&
            dep.props.targetProxy.props.containerPortal.uuid === uuid
          );
        }
      } else {
        return dep.props.target.uuid === target.uuid;
      }
      return false;
    });
  }

  createBuildPhase<
    TBuildPhase extends
      | typeof PBXSourcesBuildPhase
      | typeof PBXRezBuildPhase
      | typeof PBXHeadersBuildPhase
      | typeof PBXCopyFilesBuildPhase
      | typeof PBXResourcesBuildPhase
      | typeof PBXFrameworksBuildPhase
      | typeof PBXAppleScriptBuildPhase
      | typeof PBXShellScriptBuildPhase
  >(
    buildPhaseKlass: TBuildPhase,
    props?: SansIsa<Partial<ConstructorParameters<TBuildPhase>[2]>>
  ): InstanceType<TBuildPhase> {
    const phase = this.getXcodeProject().createModel({
      isa: buildPhaseKlass.isa,
      ...props,
    });

    this.props.buildPhases.push(phase);
    return phase;
  }

  getBuildPhase<
    TBuildPhase extends
      | typeof PBXSourcesBuildPhase
      | typeof PBXRezBuildPhase
      | typeof PBXHeadersBuildPhase
      | typeof PBXCopyFilesBuildPhase
      | typeof PBXResourcesBuildPhase
      | typeof PBXFrameworksBuildPhase
      | typeof PBXAppleScriptBuildPhase
      | typeof PBXShellScriptBuildPhase
  >(buildPhaseKlass: TBuildPhase): InstanceType<TBuildPhase> | null {
    const v =
      this.props.buildPhases.find((phase: any) => buildPhaseKlass.is(phase)) ??
      null;
    return v as InstanceType<TBuildPhase> | null;
  }

  isReferencing(uuid: string): boolean {
    if (this.props.buildConfigurationList.uuid === uuid) return true;
    if (this.props.dependencies.some((dep) => dep.uuid === uuid)) return true;
    if (this.props.buildPhases.some((phase) => phase.uuid === uuid))
      return true;

    return false;
  }

  protected getObjectProps(): any {
    return {
      buildConfigurationList: String,
      dependencies: [String],
      buildPhases: [String],
    };
  }

  getDefaultConfiguration() {
    return this.props.buildConfigurationList.getDefaultConfiguration();
  }

  /** Set a build setting on all build configurations. */
  setBuildSetting<TSetting extends keyof json.BuildSettings>(
    key: TSetting,
    value: json.BuildSettings[TSetting]
  ) {
    return this.props.buildConfigurationList.setBuildSetting(key, value);
  }

  /** Remove a build setting on all build configurations. */
  removeBuildSetting<TSetting extends keyof json.BuildSettings>(key: TSetting) {
    return this.props.buildConfigurationList.removeBuildSetting(key);
  }

  /** @returns build setting from the default build configuration. */
  getDefaultBuildSetting<TSetting extends keyof json.BuildSettings>(
    key: TSetting
  ) {
    return this.props.buildConfigurationList.getDefaultBuildSetting(key);
  }

  getAttributes() {
    return this.getXcodeProject().rootObject.props.attributes
      .TargetAttributes?.[this.uuid];
  }
}
