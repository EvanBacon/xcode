import * as json from "../json/types";
import { AbstractGroup } from "./AbstractGroup";

import type { PickRequired, SansIsa } from "./utils/util.types";
import type { PBXGroup } from "./AbstractGroup";
import type { XcodeProject } from "./XcodeProject";
import type { PBXFileReference } from "./PBXFileReference";
import type { PBXReferenceProxy } from "./PBXReferenceProxy";

export type XCVersionGroupModel = json.XCVersionGroup<
  PBXGroup | PBXReferenceProxy | PBXFileReference
>;

export class XCVersionGroup extends AbstractGroup<XCVersionGroupModel> {
  static isa = json.ISA.XCVersionGroup as const;
  static is(object: any): object is XCVersionGroup {
    return object.isa === XCVersionGroup.isa;
  }
  static create(
    project: XcodeProject,
    opts: PickRequired<SansIsa<XCVersionGroupModel>, "currentVersion">
  ) {
    return project.createModel<XCVersionGroupModel>({
      isa: XCVersionGroup.isa,
      children: [],
      sourceTree: "<group>",
      versionGroupType: "wrapper.xcdatamodel",
      ...opts,
    }) as XCVersionGroup;
  }
  protected setupDefaults(): void {
    if (!this.props.versionGroupType) {
      this.props.versionGroupType = "wrapper.xcdatamodel";
    }
    super.setupDefaults();
  }
}
