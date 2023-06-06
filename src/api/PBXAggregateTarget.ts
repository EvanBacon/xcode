import * as json from "../json/types";
import { AbstractTarget } from "./AbstractTarget";

import type { PickRequired, SansIsa } from "./utils/util.types";
import type { XcodeProject } from "./XcodeProject";
import type { AnyBuildPhase } from "./PBXSourcesBuildPhase";
import type { PBXTargetDependency } from "./PBXTargetDependency";
import type { XCConfigurationList } from "./XCConfigurationList";

export class PBXAggregateTarget extends AbstractTarget<
  json.PBXAggregateTarget<
    XCConfigurationList,
    PBXTargetDependency,
    AnyBuildPhase
  >
> {
  static isa = json.ISA.PBXAggregateTarget as const;
  static is(object: any): object is PBXAggregateTarget {
    return object.isa === PBXAggregateTarget.isa;
  }
  static create(
    project: XcodeProject,
    opts: PickRequired<
      SansIsa<json.PBXNativeTarget>,
      "name" | "buildConfigurationList"
    >
  ) {
    return project.createModel<json.PBXAggregateTarget>({
      isa: PBXAggregateTarget.isa,
      buildPhases: [],
      dependencies: [],
      ...opts,
    }) as PBXAggregateTarget;
  }
}
