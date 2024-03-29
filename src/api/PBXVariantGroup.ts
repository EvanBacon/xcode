import * as json from "../json/types";
import { AbstractGroup } from "./AbstractGroup";

import type { SansIsa } from "./utils/util.types";
import type { PBXGroup } from "./AbstractGroup";
import type { XcodeProject } from "./XcodeProject";
import type { PBXFileReference } from "./PBXFileReference";
import type { PBXReferenceProxy } from "./PBXReferenceProxy";

export type PBXVariantGroupModel = json.PBXVariantGroup<
  PBXGroup | PBXReferenceProxy | PBXFileReference
>;

export class PBXVariantGroup extends AbstractGroup<PBXVariantGroupModel> {
  static isa = json.ISA.PBXVariantGroup as const;
  static is(object: any): object is PBXVariantGroup {
    return object.isa === PBXVariantGroup.isa;
  }
  static create(
    project: XcodeProject,
    opts: Partial<SansIsa<PBXVariantGroupModel>>
  ) {
    return project.createModel<PBXVariantGroupModel>({
      isa: PBXVariantGroup.isa,
      children: [],
      sourceTree: "<group>",
      ...opts,
    }) as PBXVariantGroup;
  }
}
