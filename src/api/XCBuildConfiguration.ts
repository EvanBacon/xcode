import * as json from "../json/types";
import { AbstractObject } from "./AbstractObject";

import type { SansIsa } from "./utils/util.types";
import type { XcodeProject } from "./XcodeProject";
import type { PBXFileReference } from "./PBXFileReference";

export type XCBuildConfigurationModel =
  json.XCBuildConfiguration<PBXFileReference>;

export class XCBuildConfiguration extends AbstractObject<XCBuildConfigurationModel> {
  static isa = json.ISA.XCBuildConfiguration as const;
  static is(object: any): object is XCBuildConfiguration {
    return object.isa === XCBuildConfiguration.isa;
  }

  static create(
    project: XcodeProject,
    opts: SansIsa<XCBuildConfigurationModel>
  ) {
    return project.createModel<XCBuildConfigurationModel>({
      isa: json.ISA.XCBuildConfiguration,
      ...opts,
    }) as XCBuildConfiguration;
  }

  protected getObjectProps() {
    return {
      baseConfigurationReference: String,
    };
  }
}
