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

export class PBXNativeTarget extends AbstractTarget<
  json.PBXNativeTarget<
    XCConfigurationList,
    PBXTargetDependency,
    AnyBuildPhase,
    PBXBuildRule,
    PBXFileReference,
    XCSwiftPackageProductDependency
  >
> {
  static isa = json.ISA.PBXNativeTarget as const;
  static is(object: any): object is PBXNativeTarget {
    return object.isa === PBXNativeTarget.isa;
  }

  static create(
    project: XcodeProject,
    opts: PickRequired<
      SansIsa<json.PBXNativeTarget>,
      "name" | "productType" | "buildConfigurationList"
    >
  ) {
    return project.createModel<json.PBXNativeTarget>({
      isa: json.ISA.PBXNativeTarget,
      buildPhases: [],
      buildRules: [],
      dependencies: [],
      // TODO: Should we default the product name to the target name?
      ...opts,
    }) as PBXNativeTarget;
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
