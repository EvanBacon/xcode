import * as json from "../json/types";
import { AbstractTarget } from "./AbstractTarget";

import type { AnyBuildPhase } from "./PBXSourcesBuildPhase";
import type { PBXTargetDependency } from "./PBXTargetDependency";
import type { XCConfigurationList } from "./XCConfigurationList";

export class PBXLegacyTarget extends AbstractTarget<
  json.PBXLegacyTarget<XCConfigurationList, PBXTargetDependency, AnyBuildPhase>
> {
  static isa = json.ISA.PBXLegacyTarget as const;
  static is(object: any): object is PBXLegacyTarget {
    return object.isa === PBXLegacyTarget.isa;
  }
}
