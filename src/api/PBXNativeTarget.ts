import * as json from "../json/types";
import { AbstractTarget } from "./AbstractTarget";

import type { PickRequired, SansIsa } from "./utils/util.types";
import type { XcodeProject } from "./XcodeProject";
import type { PBXBuildRule } from "./PBXBuildRule";
import type { PBXFileReference } from "./PBXFileReference";
import type { AnyBuildPhase } from "./PBXSourcesBuildPhase";
import type { PBXTargetDependency } from "./PBXTargetDependency";
import type { XCConfigurationList } from "./XCConfigurationList";
import type { XCSwiftPackageProductDependency } from "./XCSwiftPackageProductDependency";

export type PBXNativeTargetModel = json.PBXNativeTarget<
  XCConfigurationList,
  PBXTargetDependency,
  AnyBuildPhase,
  PBXBuildRule,
  PBXFileReference,
  XCSwiftPackageProductDependency
>;

export class PBXNativeTarget extends AbstractTarget<PBXNativeTargetModel> {
  static isa = json.ISA.PBXNativeTarget as const;
  static is(object: any): object is PBXNativeTarget {
    return object.isa === PBXNativeTarget.isa;
  }

  static create(
    project: XcodeProject,
    opts: PickRequired<
      SansIsa<PBXNativeTargetModel>,
      "name" | "productType" | "buildConfigurationList"
    >
  ) {
    return project.createModel<PBXNativeTargetModel>({
      isa: json.ISA.PBXNativeTarget,
      buildPhases: [],
      buildRules: [],
      dependencies: [],
      // TODO: Should we default the product name to the target name?
      ...opts,
    }) as PBXNativeTarget;
  }

  isReferencing(uuid: string): boolean {
    if (this.props.buildRules.some((rule) => rule.uuid === uuid)) return true;
    if (this.props.packageProductDependencies?.some((dep) => dep.uuid === uuid))
      return true;
    if (this.props.productReference?.uuid === uuid) return true;

    return super.isReferencing(uuid);
  }

  protected getObjectProps(): Partial<{
    buildRules: any;
    productType: any;
    productReference?: any;
    productInstallPath?: any;
    packageProductDependencies?: any;
    productName?: any;
    buildConfigurationList: any;
    dependencies: any;
    buildPhases: any;
  }> {
    return {
      ...super.getObjectProps(),
      buildRules: [String],
      productReference: [String],
      packageProductDependencies: [String],
    };
  }
}
