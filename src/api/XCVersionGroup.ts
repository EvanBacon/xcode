import * as json from "../json/types";
import { AbstractGroup } from "./AbstractGroup";

import type { PickRequired, SansIsa } from "../util.types";
import type { PBXGroup } from "./AbstractGroup";
import type { XcodeProject } from "./XcodeProject";
import type { PBXFileReference } from "./PBXFileReference";
import type { PBXReferenceProxy } from "./PBXReferenceProxy";

export class XCVersionGroup extends AbstractGroup<
  json.XCVersionGroup<PBXGroup | PBXReferenceProxy | PBXFileReference>
> {
  static isa = json.ISA.XCVersionGroup as const;
  static is(object: any): object is XCVersionGroup {
    return object.isa === XCVersionGroup.isa;
  }
  static create(
    project: XcodeProject,
    opts: PickRequired<SansIsa<json.XCVersionGroup>, "currentVersion">
  ) {
    return project.createModel<json.XCVersionGroup>({
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
