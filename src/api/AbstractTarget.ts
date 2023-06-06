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

  protected getObjectProps(): any {
    return {
      buildConfigurationList: String,
      dependencies: [String],
      buildPhases: [String],
    };
  }
}
