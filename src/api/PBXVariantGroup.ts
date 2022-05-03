import * as json from "../json/types";
import { AbstractGroup } from "./AbstractGroup";

import type { SansIsa } from "../util.types";
import type { PBXGroup } from "./AbstractGroup";
import type { XcodeProject } from "./XcodeProject";
import type { PBXFileReference } from "./PBXFileReference";
import type { PBXReferenceProxy } from "./PBXReferenceProxy";

export class PBXVariantGroup extends AbstractGroup<
  json.PBXVariantGroup<PBXGroup | PBXReferenceProxy | PBXFileReference>
> {
  static isa = json.ISA.PBXVariantGroup as const;
  static is(object: any): object is PBXVariantGroup {
    return object.isa === PBXVariantGroup.isa;
  }
  static create(
    project: XcodeProject,
    opts: Partial<SansIsa<json.PBXVariantGroup>>
  ) {
    return project.createModel<json.PBXVariantGroup>({
      isa: PBXVariantGroup.isa,
      children: [],
      sourceTree: "<group>",
      ...opts,
    }) as PBXVariantGroup;
  }
}
